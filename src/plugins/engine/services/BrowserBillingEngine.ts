import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';
import {
  IBillingEngine,
  EffectiveRateResult,
  RangeBillingResult,
  RateStatus,
  TaskBillingSummary,
  CurrencyBillingSummary,
} from '@common/engine/billing/types';
import { calculateRangeMetrics } from '../elapsed';

import {
  parseRateToCents,
  formatCents,
  calculateBankersAmount,
} from '@common/engine/billing/utils';

export { parseRateToCents, formatCents, calculateBankersAmount };

export class BrowserBillingEngine implements IBillingEngine {
  private persistence: PersistenceRouter;

  constructor(persistence?: PersistenceRouter) {
    this.persistence = persistence ?? PersistenceRouter.getInstance();
  }

  async resolveEffectiveTaskRate(taskId: string): Promise<EffectiveRateResult> {
    const state = await this.persistence.core.load();
    if (!state) {
      return {
        rate: null,
        currency: null,
        status: 'unconfigured',
        source: 'none',
      };
    }

    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) {
      return {
        rate: null,
        currency: null,
        status: 'unconfigured',
        source: 'none',
      };
    }

    const project = state.projects.find((p) => p.id === task.projectId);

    // Currency resolution order: Task billingCurrency/currency -> Project billingCurrency/currency
    const currency =
      task.billingCurrency ||
      task.currency ||
      (project ? project.billingCurrency || project.currency : null) ||
      null;

    // Level 1: Task override
    let taskCents: number | null = null;
    if (task.billingRateCents !== undefined && task.billingRateCents !== null) {
      taskCents = Number(task.billingRateCents);
    } else if (task.hourlyRate && task.hourlyRate.trim().length > 0) {
      taskCents = parseRateToCents(task.hourlyRate);
    }

    if (taskCents !== null) {
      if (taskCents === 0) {
        return {
          rate: '0.00',
          currency,
          status: 'non_billable',
          source: 'task',
        };
      }
      return {
        rate: formatCents(taskCents),
        currency,
        status: 'custom',
        source: 'task',
      };
    }

    // Level 2: Project rate inheritance
    let projCents: number | null = null;
    if (project) {
      if (project.billingRateCents !== undefined && project.billingRateCents !== null) {
        projCents = Number(project.billingRateCents);
      } else if (project.hourlyRate && project.hourlyRate.trim().length > 0) {
        projCents = parseRateToCents(project.hourlyRate);
      }
    }

    if (projCents !== null) {
      if (projCents === 0) {
        return {
          rate: '0.00',
          currency,
          status: 'non_billable',
          source: 'project',
        };
      }
      return {
        rate: formatCents(projCents),
        currency,
        status: 'inherited',
        source: 'project',
      };
    }

    // Level 3: Default system / runtime configuration rate
    try {
      const configs = await this.persistence.runtimeConfigs?.getAll();
      const cfg = configs?.find(
        (c) =>
          c.id === 'default_billing_rate' ||
          c.id === 'default_rate' ||
          c.runtime === 'billing_default'
      );
      if (cfg?.config) {
        const cents = parseRateToCents(cfg.config);
        if (cents !== null) {
          const isZero = cents === 0;
          return {
            rate: isZero ? '0.00' : formatCents(cents),
            currency,
            status: isZero ? 'non_billable' : 'inherited',
            source: 'default',
          };
        }
      }
    } catch {
      // Fall through on config lookup errors
    }

    // Level 4: Unconfigured fallback
    return {
      rate: null,
      currency,
      status: 'unconfigured',
      source: 'none',
    };
  }

  async calculateRangeBilling(
    range: ElapsedRangeFilter,
    nowIso?: string
  ): Promise<RangeBillingResult> {
    const state = await this.persistence.core.load();
    if (!state) {
      return {
        byCurrency: {},
        byTask: [],
        totalBillableSeconds: 0,
        totalNonBillableSeconds: 0,
        totalUnconfiguredSeconds: 0,
      };
    }

    const patches = range.includePatches ? await this.persistence.patches.getAll() : [];
    const metrics = calculateRangeMetrics(range, state.tasks, state.logs, nowIso, patches);

    const taskMap = new Map(state.tasks.map((t) => [t.id, t]));

    const byTask: TaskBillingSummary[] = [];
    const currencyCents = new Map<string, number>();
    const currencyBillableSecs = new Map<string, number>();
    const currencyNonBillableSecs = new Map<string, number>();
    const currencyUnconfiguredSecs = new Map<string, number>();

    let totalBillableSeconds = 0;
    let totalNonBillableSeconds = 0;
    let totalUnconfiguredSeconds = 0;

    const taskEntries = Object.entries(metrics.taskElapsed);
    taskEntries.sort(([a], [b]) => a.localeCompare(b));

    for (const [taskId, durationSeconds] of taskEntries) {
      if (durationSeconds <= 0) continue;

      const task = taskMap.get(taskId);
      if (!task) continue;

      const effective = await this.resolveEffectiveTaskRate(taskId);
      const currency = effective.currency;
      const currKey = currency ?? 'UNKNOWN';

      let amountStr: string | null;

      if (effective.status === 'non_billable') {
        totalNonBillableSeconds += durationSeconds;
        currencyNonBillableSecs.set(
          currKey,
          (currencyNonBillableSecs.get(currKey) ?? 0) + durationSeconds
        );
        amountStr = '0.00';
      } else if (effective.status === 'unconfigured') {
        totalUnconfiguredSeconds += durationSeconds;
        currencyUnconfiguredSecs.set(
          currKey,
          (currencyUnconfiguredSecs.get(currKey) ?? 0) + durationSeconds
        );
        amountStr = null;
      } else {
        totalBillableSeconds += durationSeconds;
        currencyBillableSecs.set(
          currKey,
          (currencyBillableSecs.get(currKey) ?? 0) + durationSeconds
        );
        const cents = effective.rate ? parseRateToCents(effective.rate) ?? 0 : 0;
        const amtCents = calculateBankersAmount(durationSeconds, cents);
        currencyCents.set(currKey, (currencyCents.get(currKey) ?? 0) + amtCents);
        amountStr = formatCents(amtCents);
      }

      byTask.push({
        taskId,
        taskName: task.name,
        projectId: task.projectId,
        durationSeconds,
        effectiveRate: effective.rate,
        currency,
        rateStatus: effective.status as RateStatus,
        amount: amountStr,
      });
    }

    const allCurrKeys = new Set<string>([
      ...currencyCents.keys(),
      ...currencyBillableSecs.keys(),
      ...currencyNonBillableSecs.keys(),
      ...currencyUnconfiguredSecs.keys(),
    ]);

    const byCurrency: Record<string, CurrencyBillingSummary> = {};
    for (const curr of allCurrKeys) {
      const totalCents = currencyCents.get(curr) ?? 0;
      byCurrency[curr] = {
        currency: curr,
        totalAmount: formatCents(totalCents),
        billableDurationSeconds: currencyBillableSecs.get(curr) ?? 0,
        nonBillableDurationSeconds: currencyNonBillableSecs.get(curr) ?? 0,
        unconfiguredDurationSeconds: currencyUnconfiguredSecs.get(curr) ?? 0,
      };
    }

    return {
      byCurrency,
      byTask,
      totalBillableSeconds,
      totalNonBillableSeconds,
      totalUnconfiguredSeconds,
    };
  }
}

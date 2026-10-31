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

export function parseRateToCents(s: string): number | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  const parts = trimmed.split('.');
  if (parts.length > 2) return null;
  const whole = Number(parts[0]);
  if (isNaN(whole) || whole < 0 || !Number.isInteger(whole)) return null;
  if (parts.length === 2) {
    const fracStr = parts[1];
    if (!/^\d*$/.test(fracStr)) return null;
    let frac = 0;
    if (fracStr.length === 1) {
      frac = Number(fracStr) * 10;
    } else if (fracStr.length >= 2) {
      frac = Number(fracStr.slice(0, 2));
    }
    return whole * 100 + frac;
  }
  return whole * 100;
}

export function formatCents(cents: number): string {
  const whole = Math.floor(cents / 100);
  const frac = cents % 100;
  return `${whole}.${frac.toString().padStart(2, '0')}`;
}

export function calculateBankersAmount(durationSeconds: number, rateCents: number): number {
  const product = BigInt(durationSeconds) * BigInt(rateCents);
  const divisor = 3600n;
  const q = product / divisor;
  const r = product % divisor;
  const doubleR = r * 2n;
  if (doubleR > divisor) {
    return Number(q + 1n);
  } else if (doubleR < divisor) {
    return Number(q);
  } else if (q % 2n !== 0n) {
    return Number(q + 1n);
  } else {
    return Number(q);
  }
}

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
    const currency = project?.currency ?? null;

    if (task.hourlyRate && task.hourlyRate.trim().length > 0) {
      const cents = parseRateToCents(task.hourlyRate);
      if (cents !== null) {
        if (cents === 0) {
          return {
            rate: '0.00',
            currency,
            status: 'non_billable',
            source: 'task',
          };
        }
        return {
          rate: formatCents(cents),
          currency,
          status: 'custom',
          source: 'task',
        };
      }
    }

    if (project?.hourlyRate && project.hourlyRate.trim().length > 0) {
      const cents = parseRateToCents(project.hourlyRate);
      if (cents !== null) {
        if (cents === 0) {
          return {
            rate: '0.00',
            currency,
            status: 'non_billable',
            source: 'project',
          };
        }
        return {
          rate: formatCents(cents),
          currency,
          status: 'inherited',
          source: 'project',
        };
      }
    }

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
    const projectMap = new Map(state.projects.map((p) => [p.id, p]));

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

      const project = projectMap.get(task.projectId);
      const currency = project?.currency ?? null;
      const currKey = currency ?? 'UNKNOWN';

      const effective = await this.resolveEffectiveTaskRate(taskId);
      let amountStr: string | null = null;

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

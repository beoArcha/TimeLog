import { Task } from '@bindings/Task';
import { Project } from '@bindings/Project';
import {
  EffectiveRateResult,
  RangeBillingResult,
  TaskBillingSummary,
  CurrencyBillingSummary,
} from './types';
import {
  MAX_BILLING_RATE_CENTS,
  parseRateToCents,
  formatCents,
  calculateBankersAmount,
} from './utils';

export interface BillingRateEntity {
  hourlyRate?: string | null;
  billingRateCents?: bigint | number | null;
  currency?: string | null;
  billingCurrency?: string | null;
}

export function normalizeCurrency(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Rust upper-cases ASCII only; toUpperCase() would also rewrite characters such as 'ß'.
  return trimmed.length > 0 ? trimmed.replace(/[a-z]+/g, (letters) => letters.toUpperCase()) : null;
}

/**
 * A stored cents value outside `0..=MAX_BILLING_RATE_CENTS` is corrupt data. Like the Rust engine it
 * counts as "no rate at this level" and must not fall back to the legacy `hourlyRate` string.
 */
function validStoredCents(raw: bigint | number): number | null {
  if (typeof raw === 'number' && !Number.isInteger(raw)) return null;
  const cents = BigInt(raw);
  return cents >= 0n && cents <= BigInt(MAX_BILLING_RATE_CENTS) ? Number(cents) : null;
}

function configuredCents(entity: BillingRateEntity): number | null {
  if (entity.billingRateCents !== undefined && entity.billingRateCents !== null) {
    return validStoredCents(entity.billingRateCents);
  }
  if (entity.hourlyRate && entity.hourlyRate.trim().length > 0) {
    return parseRateToCents(entity.hourlyRate);
  }
  return null;
}

export function resolveEffectiveCurrency(
  task: BillingRateEntity,
  project?: BillingRateEntity | null
): string | null {
  const taskBillingCurr = normalizeCurrency(task.billingCurrency);
  if (taskBillingCurr) return taskBillingCurr;

  const taskCurr = normalizeCurrency(task.currency);
  if (taskCurr) return taskCurr;

  const projBillingCurr = normalizeCurrency(project?.billingCurrency);
  if (projBillingCurr) return projBillingCurr;

  return normalizeCurrency(project?.currency);
}

/**
 * Pure effective-rate resolver: resolves inheritance across task, project and
 * optional runtime default rate without performing any persistence I/O.
 */
export function resolveEffectiveRate(
  task: BillingRateEntity,
  project?: BillingRateEntity | null,
  defaultRateCents?: number | null
): EffectiveRateResult {
  const currency = resolveEffectiveCurrency(task, project);

  // Level 1: Task override
  const taskCents = configuredCents(task);

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
  const projCents = project ? configuredCents(project) : null;

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
  if (defaultRateCents !== undefined && defaultRateCents !== null) {
    const isZero = defaultRateCents === 0;
    return {
      rate: isZero ? '0.00' : formatCents(defaultRateCents),
      currency,
      status: isZero ? 'non_billable' : 'inherited',
      source: 'default',
    };
  }

  // Level 4: Unconfigured fallback
  return {
    rate: null,
    currency,
    status: 'unconfigured',
    source: 'none',
  };
}

/**
 * Pure range billing calculator: computes task-level and currency-level summaries
 * from an already-computed elapsed metrics snapshot and task/project entities.
 */
export function calculateRangeBillingFromSnapshot(
  metrics: { taskElapsed: Record<string, number> },
  tasks: Task[],
  projects: Project[],
  defaultRateCents?: number | null
): RangeBillingResult {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const projectMap = new Map(projects.map((p) => [p.id, p]));

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
    const effective = resolveEffectiveRate(task, project, defaultRateCents);
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
      rateStatus: effective.status,
      amount: amountStr,
    });
  }

  const byCurrency: Record<string, CurrencyBillingSummary> = {};
  const allCurrencies = new Set<string>([
    ...currencyCents.keys(),
    ...currencyBillableSecs.keys(),
    ...currencyNonBillableSecs.keys(),
    ...currencyUnconfiguredSecs.keys(),
  ]);

  for (const curr of Array.from(allCurrencies).sort()) {
    const cents = currencyCents.get(curr) ?? 0;
    byCurrency[curr] = {
      currency: curr,
      totalAmount: formatCents(cents),
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

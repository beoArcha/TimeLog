import { formatCents, parseRateToCents } from '@common/engine/billing/utils';

export type TaskBillingFormMode = 'inherit' | 'non_billable' | 'custom';

export interface TaskBillingFormState {
  readonly mode: TaskBillingFormMode;
  readonly customRate: string;
}

export interface TaskBillingFormInput {
  readonly hourlyRate?: string | null;
  readonly billingRateCents?: bigint | number | null;
}

/**
 * Maps task billing data to initial UI form state, identifying non-billable zero rates
 * and separating custom amounts from inheritance mode.
 *
 * Respects canonical `billingRateCents` over legacy `hourlyRate` with the same
 * precedence and normalization rules as the billing engine resolver.
 */
export function getTaskBillingFormInitialState(
  task: TaskBillingFormInput
): TaskBillingFormState {
  let taskCents: number | null = null;
  if (task.billingRateCents !== undefined && task.billingRateCents !== null) {
    taskCents = Number(task.billingRateCents);
  } else if (task.hourlyRate && task.hourlyRate.trim().length > 0) {
    taskCents = parseRateToCents(task.hourlyRate);
  }

  if (taskCents === null) {
    return { mode: 'inherit', customRate: '' };
  }
  if (taskCents === 0) {
    return { mode: 'non_billable', customRate: '' };
  }
  return { mode: 'custom', customRate: formatCents(taskCents) };
}

/**
 * Converts UI form state back into domain billing values:
 * - 'inherit' -> null
 * - 'non_billable' -> '0.00'
 * - 'custom' -> customRate.trim() or null if empty
 */
export function mapBillingFormToHourlyRate(
  mode: TaskBillingFormMode,
  customRate: string
): string | null {
  if (mode === 'inherit') {
    return null;
  }
  if (mode === 'non_billable') {
    return '0.00';
  }
  const trimmed = customRate.trim();
  return trimmed || null;
}

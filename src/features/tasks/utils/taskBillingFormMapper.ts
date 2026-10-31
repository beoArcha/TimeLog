import { Task } from '@bindings/Task';

export type TaskBillingFormMode = 'inherit' | 'non_billable' | 'custom';

export interface TaskBillingFormState {
  readonly mode: TaskBillingFormMode;
  readonly customRate: string;
}

/**
 * Maps task billing data to initial UI form state, identifying non-billable zero rates
 * and separating custom amounts from inheritance mode.
 */
export function getTaskBillingFormInitialState(
  task: Pick<Task, 'hourlyRate'>
): TaskBillingFormState {
  if (task.hourlyRate === null || task.hourlyRate === undefined) {
    return { mode: 'inherit', customRate: '' };
  }
  const trimmed = task.hourlyRate.trim();
  if (trimmed === '0' || trimmed === '0.00') {
    return { mode: 'non_billable', customRate: '' };
  }
  return { mode: 'custom', customRate: task.hourlyRate };
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

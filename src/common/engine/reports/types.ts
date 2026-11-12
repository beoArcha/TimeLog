import type { PatchLog } from '@bindings/PatchLog';
import type { Project } from '@bindings/Project';
import type { Task } from '@bindings/Task';
import type { TimeLog } from '@bindings/TimeLog';

/** Everything a report reads, captured once so every figure comes from the same data. */
export interface ReportSnapshot {
  readonly projects: readonly Project[];
  readonly tasks: readonly Task[];
  readonly logs: readonly TimeLog[];
  readonly patches: readonly PatchLog[];
  /**
   * Fallback hourly rate for tasks and projects that configure none; read once so every figure uses
   * the rates configured at the same instant.
   */
  readonly defaultRateCents?: number | null;
}

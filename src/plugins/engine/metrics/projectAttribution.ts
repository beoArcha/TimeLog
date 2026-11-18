import { Task } from '@bindings/Task';

/**
 * Resolves the project an interval is attributed to, matching the report builder and billing.
 * The task's current project wins because moving a task re-homes its history; the interval's own
 * project is a fallback for orphaned or task-less entries only.
 */
export function createProjectAttribution(tasks: readonly Task[]) {
  const projectByTask = new Map<string, string>(tasks.map((task) => [task.id, task.projectId]));

  return (taskId: string | null | undefined, ownProjectId: string): string =>
    (taskId ? projectByTask.get(taskId) : undefined) ?? ownProjectId;
}

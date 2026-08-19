import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { calculateTaskElapsed, calculateProjectElapsed } from '@plugins/engine/elapsed';

/**
 * @deprecated Legacy migration forwarder. Access via IEngine / EngineRouter.
 */
export function getTaskDurationSeconds(
  taskId: string,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): number {
  return calculateTaskElapsed(taskId, tasks, logs, nowIso);
}

/**
 * @deprecated Legacy migration forwarder. Access via IEngine / EngineRouter.
 */
export function getProjectDurationSeconds(
  projectId: string,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): number {
  return calculateProjectElapsed(projectId, tasks, logs, nowIso);
}

export function formatSeconds(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function formatFriendlyDuration(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const mins = Math.floor(totalSeconds / 60);
  if (mins < 60) return `${mins}m ${totalSeconds % 60}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

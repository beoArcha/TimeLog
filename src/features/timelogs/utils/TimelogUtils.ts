import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

/**
 * Pure calculation: Calculates total elapsed seconds for a task and its subtasks from in-memory arrays.
 */
export function getTaskDurationSeconds(
  taskId: string,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): number {
  const currentNow = nowIso ? new Date(nowIso).getTime() : Date.now();
  let totalSeconds = 0;

  const taskLogs = logs.filter(log => log.taskId === taskId);
  for (const log of taskLogs) {
    const start = new Date(log.startTime).getTime();
    const end = log.endTime ? new Date(log.endTime).getTime() : currentNow;
    if (end >= start) {
      totalSeconds += Math.max(0, Math.floor((end - start) / 1000));
    }
  }

  const childTasks = tasks.filter(t => t.parentTaskId === taskId);
  for (const child of childTasks) {
    totalSeconds += getTaskDurationSeconds(child.id, tasks, logs, nowIso);
  }

  return totalSeconds;
}

/**
 * Pure calculation: Calculates total elapsed seconds for all root tasks in a project from in-memory arrays.
 */
export function getProjectDurationSeconds(
  projectId: string,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): number {
  const rootTasks = tasks.filter(t => t.projectId === projectId && !t.parentTaskId);
  let totalSeconds = 0;
  for (const task of rootTasks) {
    totalSeconds += getTaskDurationSeconds(task.id, tasks, logs, nowIso);
  }
  return totalSeconds;
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

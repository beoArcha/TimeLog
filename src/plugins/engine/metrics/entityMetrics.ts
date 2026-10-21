import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

/**
 * Pure calculation: Calculates total elapsed seconds for a task and its subtasks.
 * Internal to EnginePlugin (Browser runtime). Does NOT mutate state.
 */
export function calculateTaskElapsed(
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
    totalSeconds += calculateTaskElapsed(child.id, tasks, logs, nowIso);
  }

  return totalSeconds;
}

/**
 * Pure calculation: Calculates total elapsed seconds for all root tasks in a project.
 * Internal to EnginePlugin (Browser runtime). Does NOT mutate state.
 */
export function calculateProjectElapsed(
  projectId: string,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): number {
  const rootTasks = tasks.filter(t => t.projectId === projectId && !t.parentTaskId);
  let totalSeconds = 0;
  for (const task of rootTasks) {
    totalSeconds += calculateTaskElapsed(task.id, tasks, logs, nowIso);
  }
  return totalSeconds;
}

import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

export interface ElapsedRangeFilter {
  from?: string;
  to?: string;
  taskId?: string;
  projectId?: string;
}

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

/**
 * Pure calculation: Calculates total elapsed seconds within a time range [from, to]
 * optionally filtered by taskId or projectId.
 * Internal to EnginePlugin (Browser runtime). Does NOT mutate state.
 */
export function calculateElapsedRange(
  range: ElapsedRangeFilter,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): number {
  const currentNow = nowIso ? new Date(nowIso).getTime() : Date.now();
  const rangeStart = range.from ? new Date(range.from).getTime() : -Infinity;
  const rangeEnd = range.to ? new Date(range.to).getTime() : Infinity;

  let relevantTaskIds: Set<string> | null = null;

  if (range.taskId) {
    relevantTaskIds = new Set<string>([range.taskId]);
    const collectSubtasks = (parent: string) => {
      for (const t of tasks) {
        if (t.parentTaskId === parent && !relevantTaskIds?.has(t.id)) {
          relevantTaskIds?.add(t.id);
          collectSubtasks(t.id);
        }
      }
    };
    collectSubtasks(range.taskId);
  } else if (range.projectId) {
    relevantTaskIds = new Set<string>(
      tasks.filter(t => t.projectId === range.projectId).map(t => t.id)
    );
  }

  let totalSeconds = 0;

  for (const log of logs) {
    if (relevantTaskIds && !relevantTaskIds.has(log.taskId)) {
      continue;
    }

    const logStart = new Date(log.startTime).getTime();
    const logEnd = log.endTime ? new Date(log.endTime).getTime() : currentNow;

    const overlapStart = Math.max(logStart, rangeStart);
    const overlapEnd = Math.min(logEnd, rangeEnd);

    if (overlapEnd >= overlapStart) {
      totalSeconds += Math.max(0, Math.floor((overlapEnd - overlapStart) / 1000));
    }
  }

  return totalSeconds;
}

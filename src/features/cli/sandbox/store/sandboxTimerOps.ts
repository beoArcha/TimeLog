import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

export function addLogOp(
  tasks: Task[],
  logs: TimeLog[],
  nextId: string,
  taskId: string,
  durationSeconds: number,
  note?: string | null,
  startTimeIso?: string
): TimeLog {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`NotFound: Task "${taskId}" does not exist`);
  }
  const end = startTimeIso ? new Date(startTimeIso) : new Date();
  const start = new Date(end.getTime() - durationSeconds * 1000);
  const newLog: TimeLog = {
    id: nextId,
    taskId: task.id,
    projectId: task.projectId,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    note: note || null,
    editHistory: null,
  };
  logs.push(newLog);
  return newLog;
}

export function removeLogOp(logs: TimeLog[], logId: string): boolean {
  const idx = logs.findIndex((l) => l.id === logId);
  if (idx === -1) return false;
  logs.splice(idx, 1);
  return true;
}

export function stopTimerOp(
  logs: TimeLog[],
  activeLog: TimeLog | null,
  nowIso?: string
): { success: boolean; error?: string; errorCode?: string } {
  if (!activeLog) {
    return {
      success: false,
      error: 'No active timer session is currently running',
      errorCode: 'ENG_TIMER_INACTIVE',
    };
  }
  const endTime = nowIso || new Date().toISOString();
  activeLog.endTime = endTime;
  const idx = logs.findIndex((l) => l.id === activeLog.id);
  if (idx !== -1) {
    logs[idx] = { ...activeLog };
  }
  return { success: true };
}

export function startTimerOp(
  tasks: Task[],
  logs: TimeLog[],
  activeLog: TimeLog | null,
  nextId: string,
  taskId: string,
  nowIso?: string
): TimeLog {
  if (!taskId) {
    throw new Error('MissingTarget: Task ID or name is required');
  }
  const task = tasks.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`NotFound: Task "${taskId}" does not exist`);
  }
  if (activeLog) {
    stopTimerOp(logs, activeLog, nowIso);
  }
  const projectId = task.projectId;
  const startTime = nowIso || new Date().toISOString();
  const newLog: TimeLog = {
    id: nextId,
    taskId,
    projectId,
    startTime,
    endTime: null,
    note: null,
    editHistory: null,
  };
  logs.push(newLog);
  return newLog;
}

export function switchTimerOp(
  tasks: Task[],
  logs: TimeLog[],
  activeLog: TimeLog | null,
  nextId: string,
  newTaskId: string,
  nowIso?: string
): TimeLog {
  if (!newTaskId) {
    throw new Error('MissingTarget: Target task is required to switch');
  }
  const task = tasks.find((t) => t.id === newTaskId);
  if (!task) {
    throw new Error(`NotFound: Task "${newTaskId}" does not exist`);
  }
  const timestamp = nowIso || new Date().toISOString();
  if (activeLog) {
    activeLog.endTime = timestamp;
    const idx = logs.findIndex((l) => l.id === activeLog.id);
    if (idx !== -1) {
      logs[idx] = { ...activeLog };
    }
  }
  const newLog: TimeLog = {
    id: nextId,
    taskId: task.id,
    projectId: task.projectId,
    startTime: timestamp,
    endTime: null,
    note: null,
    editHistory: null,
  };
  logs.push(newLog);
  return newLog;
}

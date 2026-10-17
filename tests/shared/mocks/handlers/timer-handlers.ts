import { TimeLog } from '@bindings/TimeLog';
import { MockCommandArgs, MockDatabaseState } from '../types';
import { getMockDbState, saveMockDbState } from '../state';

export const startTimerHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const taskId = args.taskId;
  if (!taskId) return state;

  const task = state.tasks.find((t) => t.id === taskId);
  if (!task) return state;

  const isRunning = state.logs.some((l) => l.taskId === taskId && !l.endTime);
  if (isRunning) {
    state.logs = state.logs.map((l) => {
      if (l.taskId === taskId && !l.endTime) {
        return { ...l, endTime: new Date().toISOString() };
      }
      return l;
    });
    if (state.activeLog?.taskId === taskId) {
      state.activeLog = null;
    }
    saveMockDbState(state);
    return state;
  }

  const parentId = task.parentTaskId;
  state.logs = state.logs.map((l) => {
    if (!l.endTime) {
      if (parentId && l.taskId === parentId) return l;
      return { ...l, endTime: new Date().toISOString() };
    }
    return l;
  });

  const newLog: TimeLog = {
    id: 'log_' + (state.logs.length + 1),
    taskId,
    projectId: task.projectId,
    startTime: new Date().toISOString(),
    endTime: null,
    note: null,
    editHistory: null,
  };
  state.logs.push(newLog);
  state.activeLog = newLog;

  if (parentId) {
    const isParentRunning = state.logs.some((l) => l.taskId === parentId && !l.endTime);
    if (!isParentRunning) {
      const parentTask = state.tasks.find((t) => t.id === parentId);
      if (parentTask) {
        state.logs.push({
          id: 'log_m_' + (state.logs.length + 1),
          taskId: parentId,
          projectId: parentTask.projectId,
          startTime: new Date().toISOString(),
          endTime: null,
          note: null,
          editHistory: null,
        });
      }
    }
  }

  saveMockDbState(state);
  return state;
};

export const stopTimerHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  state.logs = state.logs.map((l) => {
    if (!l.endTime && (!args.projectId || l.projectId === args.projectId)) {
      return { ...l, endTime: new Date().toISOString() };
    }
    return l;
  });
  if (state.activeLog && (!args.projectId || state.activeLog.projectId === args.projectId)) {
    state.activeLog = null;
  }
  saveMockDbState(state);
  return state;
};

export const TIMER_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  start_timer: startTimerHandler,
  stop_timer: stopTimerHandler,
};

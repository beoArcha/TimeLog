import { TimeLog } from '@bindings/TimeLog';
import { MockCommandArgs, MockDatabaseState } from '../types';
import { getMockDbState, saveMockDbState } from '../state';
import { calculateRangeMetrics, ElapsedRangeFilter } from '@plugins/engine/elapsed';

export const editTimeLogHandler = async (args: MockCommandArgs): Promise<MockDatabaseState> => {
  const state = getMockDbState();
  const logId = args.id;
  if (!logId) return state;

  const log = state.logs.find((l) => l.id === logId);
  if (log) {
    log.taskId = args.taskId ?? log.taskId;
    log.startTime = args.startTime ?? log.startTime;
    log.endTime = args.endTime !== undefined ? args.endTime : log.endTime;
    log.note = args.note !== undefined ? args.note : log.note;

    const historyItem = {
      editedAt: new Date().toISOString(),
      prevStartTime: args.startTime ?? '',
      prevEndTime: args.endTime ?? null,
      prevNote: args.note ?? null,
      reason: args.reason || 'Korekta',
    };
    log.editHistory = log.editHistory ? [...log.editHistory, historyItem] : [historyItem];
  }
  saveMockDbState(state);
  return state;
};

export const TIMELOG_HANDLERS: Record<string, (args: MockCommandArgs) => Promise<unknown>> = {
  edit_time_log: editTimeLogHandler,
  get_range_metrics: async (args) => {
    const state = getMockDbState();
    const patchesRaw = localStorage.getItem('mock_patches');
    const patches = patchesRaw ? JSON.parse(patchesRaw) : [];
    return calculateRangeMetrics(
      (args.range ?? {}) as ElapsedRangeFilter,
      state.tasks,
      state.logs,
      args.nowIso as string | undefined,
      patches
    );
  },
  get_elapsed_range: async (args) => {
    const state = getMockDbState();
    const patchesRaw = localStorage.getItem('mock_patches');
    const patches = patchesRaw ? JSON.parse(patchesRaw) : [];
    return calculateRangeMetrics(
      (args.range ?? {}) as ElapsedRangeFilter,
      state.tasks,
      state.logs,
      args.nowIso as string | undefined,
      patches
    ).totalSeconds;
  },
  get_for_task: async (args) => {
    return getMockDbState().logs.filter((l) => l.taskId === args.taskId);
  },
  close_active_by_project: async (args) => {
    const state = getMockDbState();
    state.logs = state.logs.map((l) => {
      if (!l.endTime && l.projectId === args.projectId) {
        return { ...l, endTime: args.endTime ?? new Date().toISOString() };
      }
      return l;
    });
    if (state.activeLog && state.activeLog.projectId === args.projectId) {
      state.activeLog = null;
    }
    saveMockDbState(state);
    return Promise.resolve();
  },
  close_all_active: async (args) => {
    const state = getMockDbState();
    state.logs = state.logs.map((l) => {
      if (!l.endTime) {
        return { ...l, endTime: args.endTime ?? new Date().toISOString() };
      }
      return l;
    });
    state.activeLog = null;
    saveMockDbState(state);
    return Promise.resolve();
  },
  insert: async (args) => {
    const state = getMockDbState();
    const task = state.tasks.find((t) => t.id === args.taskId);
    const newLog: TimeLog = {
      id: args.logId ?? 'log_' + Date.now(),
      taskId: args.taskId ?? '',
      projectId: task?.projectId ?? '',
      startTime: args.startTime ?? new Date().toISOString(),
      endTime: null,
      note: null,
      editHistory: null,
    };
    state.logs.push(newLog);
    state.activeLog = newLog;
    saveMockDbState(state);
    return Promise.resolve();
  },
  query_active: async () => {
    return getMockDbState()
      .logs.filter((l) => !l.endTime)
      .map((l) => l.taskId);
  },
  get_all: async () => {
    return getMockDbState().logs;
  },
  delete_time_log: async (args) => {
    const state = getMockDbState();
    state.logs = state.logs.filter((l) => l.id !== args.logId);
    if (state.activeLog?.id === args.logId) {
      state.activeLog = null;
    }
    saveMockDbState(state);
    return Promise.resolve();
  },
};

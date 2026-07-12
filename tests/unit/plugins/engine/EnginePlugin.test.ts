import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setupLocalStorageMock, mockInvoke } from '../../../shared/test-helpers';
import { EngineCommands } from '@common/engine/EngineCommands';
import { EnginePlugin } from '@plugins/engine/EnginePlugin';
import { STORAGE_KEYS } from '@common/constants';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

const DESKTOP_STATE_KEY = STORAGE_KEYS.STATE_DB;
const BROWSER_STATE_KEY = 'timelog_persistence_plugin_state';

// Reset mockInvoke to simulate Rust Engine exactly
let mockLogCounter = 0;
const setupMockInvokeForRustBehavior = () => {
  mockInvoke.mockImplementation(async (cmd: string, args?: { taskId?: string; projectId?: string }) => {
    const rawState = localStorage.getItem(DESKTOP_STATE_KEY);
    const state: TimerRepositoryState = rawState 
      ? JSON.parse(rawState) 
      : { projects: [], tasks: [], logs: [], activeLog: null };

    if (cmd === 'start_timer') {
      const taskId = args?.taskId;
      if (!taskId) throw new Error('taskId is required');
      const task = state.tasks.find((t: Task) => t.id === taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      const projectId = task.projectId;
      const now = new Date().toISOString();

      const projectTaskIds = new Set(
        state.tasks.filter((t: Task) => t.projectId === projectId).map((t: Task) => t.id)
      );

      const updatedLogs = state.logs.map((log: TimeLog) => {
        if (!log.endTime && projectTaskIds.has(log.taskId)) {
          return { ...log, endTime: now };
        }
        return log;
      });

      const logId = `log_${Date.now()}_${mockLogCounter++}`;
      const newLog: TimeLog = {
        id: logId,
        taskId,
        projectId,
        startTime: now,
        endTime: undefined,
        note: undefined,
        editHistory: undefined
      };
      updatedLogs.push(newLog);

      state.logs = updatedLogs;
      state.activeLog = newLog;

      localStorage.setItem(DESKTOP_STATE_KEY, JSON.stringify(state));
      return state;
    }

    if (cmd === 'stop_timer') {
      const projectId = args?.projectId;
      const now = new Date().toISOString();
      let updatedLogs: TimeLog[];

      if (projectId) {
        const projectTaskIds = new Set(
          state.tasks.filter((t: Task) => t.projectId === projectId).map((t: Task) => t.id)
        );
        updatedLogs = state.logs.map((log: TimeLog) => {
          if (!log.endTime && projectTaskIds.has(log.taskId)) {
            return { ...log, endTime: now };
          }
          return log;
        });
      } else {
        updatedLogs = state.logs.map((log: TimeLog) => {
          if (!log.endTime) {
            return { ...log, endTime: now };
          }
          return log;
        });
      }

      state.logs = updatedLogs;
      state.activeLog = updatedLogs.find((l: TimeLog) => !l.endTime) || null;

      localStorage.setItem(DESKTOP_STATE_KEY, JSON.stringify(state));
      return state;
    }

    return undefined;
  });
};

describe('Unit Tests: EnginePlugin Compliance with Desktop Runtime', () => {
  let desktopEngine: EngineCommands;
  let browserEngine: EnginePlugin;
  let localStorageStore: Record<string, string>;

  beforeEach(() => {
    localStorageStore = setupLocalStorageMock();
    desktopEngine = new EngineCommands();
    browserEngine = new EnginePlugin();

    setupMockInvokeForRustBehavior();
    mockLogCounter = 0;

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const getNormalizedState = (state: TimerRepositoryState | null) => {
    if (!state) return null;
    return {
      ...state,
      logs: state.logs.map(log => ({
        ...log,
        id: log.id.startsWith('log_') ? 'log_normalized' : log.id,
      })),
      activeLog: state.activeLog ? {
        ...state.activeLog,
        id: state.activeLog.id.startsWith('log_') ? 'log_normalized' : state.activeLog.id,
      } : null,
    };
  };

  const runComparison = async (
    initialState: TimerRepositoryState,
    action: (engine: EngineCommands | EnginePlugin) => Promise<void>
  ) => {
    // 1. Run on Desktop
    PersistenceRouter.getInstance().setImplementationForTesting(new PersistenceCommands());
    localStorageStore[DESKTOP_STATE_KEY] = JSON.stringify(initialState);
    await action(desktopEngine);
    const desktopResult = JSON.parse(localStorageStore[DESKTOP_STATE_KEY]);

    // Reset log counter to ensure ID consistency if generated
    mockLogCounter = 0;

    // 2. Run on Browser
    PersistenceRouter.getInstance().setImplementationForTesting(new PersistencePlugin());
    localStorageStore[BROWSER_STATE_KEY] = JSON.stringify(initialState);
    await action(browserEngine);
    const browserResult = JSON.parse(localStorageStore[BROWSER_STATE_KEY]);

    // 3. Compare normalized states
    expect(getNormalizedState(browserResult)).toEqual(getNormalizedState(desktopResult));
  };

  const getSampleInitialState = (): TimerRepositoryState => ({
    projects: [
      { id: 'p1', name: 'Project 1', color: 'red', createdAt: '2026-06-12' },
      { id: 'p2', name: 'Project 2', color: 'blue', createdAt: '2026-06-12' },
    ],
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026-06-12' },
      { id: 't2', projectId: 'p1', name: 'Task 2', completed: false, createdAt: '2026-06-12' },
      { id: 't3', projectId: 'p2', name: 'Task 3', completed: false, createdAt: '2026-06-12' },
    ],
    logs: [],
    activeLog: null,
  });

  it('should start timer identically on an empty state', async () => {
    const initialState = getSampleInitialState();
    await runComparison(initialState, async (engine) => {
      await engine.startTimer('t1');
    });
  });

  it('should stop active logs in the same project and start the new timer', async () => {
    const initialState = getSampleInitialState();
    // Start active log on t2 (same project p1)
    initialState.logs.push({
      id: 'existing-log',
      taskId: 't2',
      projectId: 'p1',
      startTime: '2026-06-15T11:00:00.000Z',
    });
    initialState.activeLog = initialState.logs[0];

    // Start active log on t3 (different project p2)
    initialState.logs.push({
      id: 'other-log',
      taskId: 't3',
      projectId: 'p2',
      startTime: '2026-06-15T11:30:00.000Z',
    });

    await runComparison(initialState, async (engine) => {
      await engine.startTimer('t1');
    });
  });

  it('should stop all timers when stopTimer is called without projectId', async () => {
    const initialState = getSampleInitialState();
    initialState.logs.push({
      id: 'log1',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-06-15T11:00:00.000Z',
    });
    initialState.logs.push({
      id: 'log2',
      taskId: 't3',
      projectId: 'p2',
      startTime: '2026-06-15T11:30:00.000Z',
    });
    initialState.activeLog = initialState.logs[0];

    await runComparison(initialState, async (engine) => {
      await engine.stopTimer();
    });
  });

  it('should stop only project-specific timers when stopTimer is called with projectId', async () => {
    const initialState = getSampleInitialState();
    initialState.logs.push({
      id: 'log1',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-06-15T11:00:00.000Z',
    });
    initialState.logs.push({
      id: 'log2',
      taskId: 't3',
      projectId: 'p2',
      startTime: '2026-06-15T11:30:00.000Z',
    });
    initialState.activeLog = initialState.logs[0];

    await runComparison(initialState, async (engine) => {
      await engine.stopTimer('p1');
    });
  });
});

import { vi } from 'vitest';
import { act } from '@testing-library/react';
import { OxyFlowState } from '@common/hooks/OxyContext';
import { STORAGE_KEYS } from '@common/constants';

// Storage Mock
export const setupLocalStorageMock = () => {
  const store: Record<string, string> = {};
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] || null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
    store[key] = value;
  });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
    delete store[key];
  });
  vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {
    for (const key in store) {
      delete store[key];
    }
  });
  return store;
};

export const setupMatchMediaMock = (matches = false) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

type TauriEventCallback = (event: { payload: unknown }) => void;

export const tauriEventRegistry: Record<string, TauriEventCallback> = {};

export const triggerTauriEvent = (eventName: string, payload?: unknown) => {
  if (tauriEventRegistry[eventName]) {
    act(() => {
      tauriEventRegistry[eventName]({ payload });
    });
  }
};

const STATE_DB_KEY = STORAGE_KEYS.STATE_DB;

export const mockInvoke = vi.fn().mockImplementation((cmd: string, args?: any) => {
  const rawState = localStorage.getItem(STATE_DB_KEY);
  let state: any;
  try {
    state = rawState ? JSON.parse(rawState) : null;
  } catch {
    state = null;
  }
  if (!state) {
    state = { projects: [], tasks: [], logs: [], activeLog: null };
  }
  if (!state.projects) state.projects = [];
  if (!state.tasks) state.tasks = [];
  if (!state.logs) state.logs = [];
  if (state.activeLog === undefined) state.activeLog = null;

  if (cmd === 'override_state') {
    state = { ...state, ...args.state };
    localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
    return Promise.resolve(state);
  }
  if (cmd === 'get_timer_state') {
    return Promise.resolve(state);
  }
  if (cmd === 'add_project') {
    const newProj = {
      id: String(state.projects.length + 1),
      name: args.name,
      color: args.color,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    state.projects.push(newProj);
    localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
    return Promise.resolve(state);
  }
  if (cmd === 'toggle_project_archive') {
    const proj = state.projects.find((p: any) => p.id === args.projectId);
    if (proj) proj.archived = !proj.archived;
    localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
    return Promise.resolve(state);
  }
  if (cmd === 'add_task') {
    const newTask = {
      id: String(100 + state.tasks.length + 1),
      projectId: args.projectId,
      parentTaskId: args.parentTaskId,
      name: args.name,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    state.tasks.push(newTask);
    localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
    return Promise.resolve(state);
  }
  if (cmd === 'rename_project') {
    const proj = state.projects.find((p: any) => p.id === args.projectId);
    if (proj) proj.name = args.name;
    localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
    return Promise.resolve(state);
  }
  if (cmd === 'rename_task') {
    const task = state.tasks.find((t: any) => t.id === args.taskId);
    if (task) task.name = args.name;
    localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
    return Promise.resolve(state);
  }
  if (cmd === 'delete_task') {
    const toDeleteIds = new Set<string>([args.taskId]);
    let sizeBefore: number;
    do {
      sizeBefore = toDeleteIds.size;
      state.tasks.forEach((t: any) => {
        if (t.parentTaskId && toDeleteIds.has(t.parentTaskId)) {
          toDeleteIds.add(t.id);
        }
      });
    } while (toDeleteIds.size !== sizeBefore);

    state.tasks = state.tasks.filter((t: any) => !toDeleteIds.has(t.id));
    state.logs = state.logs.filter((l: any) => !toDeleteIds.has(l.taskId));
    if (state.activeLog && toDeleteIds.has(state.activeLog.taskId)) {
      state.activeLog = null;
    }
    localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
    return Promise.resolve(state);
  }
  if (cmd === 'toggle_task_complete') {
    const task = state.tasks.find((t: any) => t.id === args.taskId);
    if (task) {
      task.completed = !task.completed;
      if (task.completed) {
        state.logs = state.logs.map((l: any) =>
          l.taskId === args.taskId && !l.endTime
            ? { ...l, endTime: new Date().toISOString() }
            : l
        );
        if (state.activeLog?.taskId === args.taskId) {
          state.activeLog = null;
        }
      }
    }
    localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
    return Promise.resolve(state);
  }
  if (cmd === 'start_timer') {
    const taskId = args.taskId;
    const task = state.tasks.find((t: any) => t.id === taskId);
    if (!task) {
      return Promise.resolve(state);
    }
    const isRunning = state.logs.some((l: any) => l.taskId === taskId && !l.endTime);
    if (isRunning) {
      state.logs = state.logs.map((l: any) => {
        if (l.taskId === taskId && !l.endTime) {
          return { ...l, endTime: new Date().toISOString() };
        }
        return l;
      });
      if (state.activeLog?.taskId === taskId) {
        state.activeLog = null;
      }
      localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
      return Promise.resolve(state);
    }

    const parentId = task.parentTaskId;
    state.logs = state.logs.map((l: any) => {
      if (!l.endTime) {
        if (parentId && l.taskId === parentId) return l;
        return { ...l, endTime: new Date().toISOString() };
      }
      return l;
    });

    const newLog = {
      id: 'log_' + (state.logs.length + 1),
      taskId,
      projectId: task.projectId,
      startTime: new Date().toISOString(),
      endTime: null,
    };
    state.logs.push(newLog);
    state.activeLog = newLog;

    if (parentId) {
      const isParentRunning = state.logs.some((l: any) => l.taskId === parentId && !l.endTime);
      if (!isParentRunning) {
        const parentTask = state.tasks.find((t: any) => t.id === parentId);
        if (parentTask) {
          state.logs.push({
            id: 'log_m_' + (state.logs.length + 1),
            taskId: parentId,
            projectId: parentTask.projectId,
            startTime: new Date().toISOString(),
            endTime: null,
          });
        }
      }
    }

    localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
    return Promise.resolve(state);
  }
  if (cmd === 'stop_timer') {
    state.logs = state.logs.map((l: any) => {
      if (!l.endTime && (!args?.projectId || l.projectId === args.projectId)) {
        return { ...l, endTime: new Date().toISOString() };
      }
      return l;
    });
    if (state.activeLog && (!args?.projectId || state.activeLog.projectId === args.projectId)) {
      state.activeLog = null;
    }
    localStorage.setItem(STATE_DB_KEY, JSON.stringify(state));
    return Promise.resolve(state);
  }
  if (cmd === 'reset_database') {
    const rawState = localStorage.getItem(STATE_DB_KEY);
    let raw: any = {};
    try {
      raw = rawState ? JSON.parse(rawState) : {};
    } catch {}
    delete raw.projects;
    delete raw.tasks;
    delete raw.logs;
    delete raw.activeLog;
    localStorage.setItem(STATE_DB_KEY, JSON.stringify(raw));
    return Promise.resolve({ projects: [], tasks: [], logs: [], activeLog: null });
  }

  return Promise.resolve(undefined);
});

vi.mock('@tauri-apps/api/core', () => ({
  invoke: (cmd: string, args?: unknown) => {
    if (args !== undefined) return mockInvoke(cmd, args);
    return mockInvoke(cmd);
  },
}));

export const mockListen = vi.fn().mockImplementation((eventName: string, callback: TauriEventCallback) => {
  tauriEventRegistry[eventName] = callback;
  return Promise.resolve(() => {
    delete tauriEventRegistry[eventName];
  });
});

vi.mock('@tauri-apps/api/event', () => ({
  listen: (eventName: string, callback: TauriEventCallback) => mockListen(eventName, callback),
}));

export const getMockOxyFlowState = (): OxyFlowState => ({
  customTranslations: {},
  setCustomTranslations: vi.fn(),
  projects: [{ id: 'p1', name: 'Proj 1', color: 'red', createdAt: '2026', archived: false }],
  setProjects: vi.fn(),
  tasks: [{ id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026' }],
  setTasks: vi.fn(),
  logs: [{ id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: null }],
  setLogs: vi.fn(),
  holidays: [],
  setHolidays: vi.fn(),
  patches: [],
  setPatches: vi.fn(),
  sysSettings: { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: false, activeSinks: [] },
  setSysSettings: vi.fn(),
  activeLog: null,
  setActiveLog: vi.fn(),
  localePref: 'system',
  setLocalePref: vi.fn(),
  locale: 'en',
  setLocale: vi.fn(),
  theme: 'dark',
  setTheme: vi.fn(),
  resolvedTheme: 'dark',
  setResolvedTheme: vi.fn(),
  guiSize: 'medium',
  setGuiSize: vi.fn(),
  textAndIconSize: 'medium',
  setTextAndIconSize: vi.fn(),
  engineState: 'connected',
  enginePID: 1234,
  minimizeToTray: false,
  setMinimizeToTray: vi.fn(),
  alwaysOnTopSmall: false,
  setAlwaysOnTopSmall: vi.fn(),
  alwaysOnTopMain: false,
  setAlwaysOnTopMain: vi.fn(),
  logToApi: false,
  setLogToApi: vi.fn(),
  apiToken: '123',
  setApiToken: vi.fn(),
  apiUrl: 'https://test-api.com',
  setApiUrl: vi.fn(),
  apiMethod: 'POST',
  setApiMethod: vi.fn(),
  apiHeaders: '{}',
  setApiHeaders: vi.fn(),
  nowIso: '2026-06-15T12:05:00Z',
  isGuiClosed: false,
  setIsGuiClosed: vi.fn(),
  selectedTaskId: null,
  setSelectedTaskId: vi.fn(),
  handleAddProject: vi.fn(),
  handleToggleProjectArchive: vi.fn(),
  handleAddTask: vi.fn(),
  handleRenameProject: vi.fn(),
  handleRenameTask: vi.fn(),
  handleDeleteTask: vi.fn(),
  handleToggleTaskComplete: vi.fn(),
  handleStartTimer: vi.fn(),
  handleStopTimer: vi.fn(),
});

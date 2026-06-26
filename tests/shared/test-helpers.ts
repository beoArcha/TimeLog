import { vi } from 'vitest';
import { act } from '@testing-library/react';
import { OxyFlowState } from '@common/providers/OxyContext';

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

export const mockInvoke = vi.fn().mockResolvedValue(undefined);

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

import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOxyFlow, OxyContext, OxyFlowState } from '@core/providers/OxyContext';
import React from 'react';

import { setupMatchMediaMock } from '../../shared/test-helpers';

beforeEach(() => {
  setupMatchMediaMock(false);
});

const mockState: OxyFlowState = {
  customTranslations: {},
  setCustomTranslations: vi.fn(),
  projects: [],
  setProjects: vi.fn(),
  tasks: [],
  setTasks: vi.fn(),
  logs: [],
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
  apiMethod: 'POST',
  setApiMethod: vi.fn(),
  apiHeaders: '',
  setApiHeaders: vi.fn(),
  apiUrl: 'url',
  setApiUrl: vi.fn(),
  nowIso: '2026',
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
};

const ContextWrapper = ({ children }: { children: React.ReactNode }) => (
  <OxyContext.Provider value={mockState}>{children}</OxyContext.Provider>
);

describe('Unit Tests: useOxyFlow Hook', () => {
  it('should_return_context_value_when_useOxyFlow_is_rendered_within_provider', () => {
    const { result } = renderHook(() => useOxyFlow(), { wrapper: ContextWrapper });
    expect(result.current.apiToken).toEqual('123');
    expect(result.current.theme).toEqual('dark');
  });
});

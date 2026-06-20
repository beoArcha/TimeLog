import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useOxyFlow, OxyContext, OxyFlowState } from '../../../src/hooks/useOxyFlow';
import React from 'react';

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), 
    removeListener: vi.fn(), 
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
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
  sysSettings: { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: false },
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

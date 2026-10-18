// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

describe('Integration Tests: DbExplorer Main Container', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  const setup = (customValue = {}) => {
    const defaultState = {
      projects: [],
      tasks: [],
      logs: [],
      holidays: [],
      patches: [],
      setProjects: vi.fn(),
      setTasks: vi.fn(),
      setLogs: vi.fn(),
      setHolidays: vi.fn(),
      setPatches: vi.fn(),
      localePref: 'system',
      setLocalePref: vi.fn(),
      locale: 'en',
      setLocale: vi.fn(),
      theme: 'dark',
      setTheme: vi.fn(),
      resolvedTheme: 'dark',
      setResolvedTheme: vi.fn(),
      customTranslations: {},
      setCustomTranslations: vi.fn(),
      sysSettings: { autoStart: false, includePatchesInReports: false },
      setSysSettings: vi.fn(),
      activeLog: null,
      setActiveLog: vi.fn(),
      engineState: 'connected',
      enginePID: 123,
      minimizeToTray: false,
      setMinimizeToTray: vi.fn(),
      alwaysOnTopSmall: false,
      setAlwaysOnTopSmall: vi.fn(),
      alwaysOnTopMain: false,
      setAlwaysOnTopMain: vi.fn(),
      logToApi: false,
      setLogToApi: vi.fn(),
      apiToken: '',
      setApiToken: vi.fn(),
      apiMethod: 'POST',
      setApiMethod: vi.fn(),
      apiHeaders: '',
      setApiHeaders: vi.fn(),
      apiUrl: '',
      setApiUrl: vi.fn(),
      nowIso: '2026-06-20T12:00:00Z',
      isGuiClosed: false,
      setIsGuiClosed: vi.fn(),
    };

    const value = { ...defaultState, ...customValue };
    const utils = render(
      <LocaleProvider>
        <MockProviders state={value}>
          <DbExplorer />
        </MockProviders>
      </LocaleProvider>
    );

    return utils;
  };

  it('should render title, description, driver badge and export button when mounted', () => {
    setup();
    expect(screen.getByText('Tauri SQLite Driver')).toBeDefined();
    expect(screen.getByRole('button', { name: /export database/i })).toBeDefined();
  });

  it('should render all subcomponent table cards when mounted', () => {
    setup();
    expect(screen.getByText(/projects table/i)).toBeDefined();
    expect(screen.getByText(/tasks table/i)).toBeDefined();
    expect(screen.getByText(/(time_logs|Time Logs) Table/i)).toBeDefined();
    expect(screen.getByText(/(holidays_leaves|Holidays and Leaves) Table/i)).toBeDefined();
    expect(screen.getByText(/(patch_logs|Patch Logs) Table/i)).toBeDefined();
  });
});

// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { OxyContext } from '@common/providers/OxyContext';
import { LocaleProvider } from '@common/providers/LocaleProvider';

describe('Integration Tests: DbExplorer Patches Table', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'prompt').mockImplementation(() => 'Mock Prompt Val');
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  const setup = (customValue = {}) => {
    const setPatches = vi.fn();

    const defaultState = {
      projects: [
        { id: 'proj_1', name: 'Project Alpha', color: 'rose', createdAt: '2026-06-12T00:00:00Z' },
      ],
      tasks: [],
      logs: [],
      holidays: [],
      patches: [
        { id: 'patch_1', projectId: 'proj_1', startTime: '2026-06-12T05:00:00Z', endTime: '2026-06-12T06:00:00Z', patchNote: 'Patch one' },
      ],
      setPatches,
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
      sysSettings: { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: false },
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
        <OxyContext.Provider value={value as any}>
          <DbExplorer />
        </OxyContext.Provider>
      </LocaleProvider>
    );

    return {
      ...utils,
      setPatches,
    };
  };

  it('should_add_and_delete_patch_manually_when_patch_table_actions_are_triggered', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const promptSpy = vi.spyOn(window, 'prompt')
      .mockReturnValueOnce('2026-06-12T05:00:00Z') // start time
      .mockReturnValueOnce('2026-06-12T06:00:00Z') // end time
      .mockReturnValueOnce('Test patch note'); // patch note

    const { setPatches } = setup();

    const addPatchBtn = screen.getByText(/add manual patch/i);
    fireEvent.click(addPatchBtn);

    expect(promptSpy).toHaveBeenCalledTimes(3);
    expect(setPatches).toHaveBeenCalled();

    // Test delete patch
    const patchesTableWrapper = screen.getByText(/patch_logs table/i).closest('.border');
    const deleteBtn = patchesTableWrapper?.querySelector('tbody tr button') as HTMLElement; // Trash2 button
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(setPatches).toHaveBeenCalledTimes(2);
  });
});

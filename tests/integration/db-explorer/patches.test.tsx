// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aPatchLog } from '@tests/shared/builders/entity-builders';

describe('Integration Tests: DbExplorer Patches Table', () => {
  beforeEach(() => {
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
        aProject({ id: 'proj_1', name: 'Project Alpha' }),
      ],
      tasks: [],
      logs: [],
      holidays: [],
      patches: [
        aPatchLog({ id: 'patch_1', projectId: 'proj_1', startTime: '2026-06-12T05:00:00Z', endTime: '2026-06-12T06:00:00Z', patchNote: 'Patch one' }),
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
        <MockProviders state={value}>
          <DbExplorer />
        </MockProviders>
      </LocaleProvider>
    );

    return {
      ...utils,
      setPatches,
    };
  };

  it('should add and delete patch manually when patch table actions are triggered', async () => {
    const { setPatches } = setup();

    const addPatchBtn = screen.getByText(/add manual patch/i);
    fireEvent.click(addPatchBtn);

    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: '2026-06-12T05:00:00Z' } });
    fireEvent.change(inputs[1], { target: { value: '2026-06-12T06:00:00Z' } });
    fireEvent.change(inputs[2], { target: { value: 'Test patch note' } });

    fireEvent.click(screen.getByRole('button', { name: /Save/i }));

    expect(setPatches).toHaveBeenCalled();

    // Test delete patch
    const deleteBtns = screen.getAllByRole('button', { name: /Delete/i });
    const patchDeleteBtn = deleteBtns[deleteBtns.length - 1];
    fireEvent.click(patchDeleteBtn);

    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog).not.toBeNull();
    const confirmBtn = within(dialog as HTMLElement).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(setPatches).toHaveBeenCalledTimes(2);
    });
  });
});

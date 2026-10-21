// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';

describe('Integration Tests: DbExplorer Tasks Table', () => {
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
    const setProjects = vi.fn();
    const setTasks = vi.fn();
    const setLogs = vi.fn();

    const defaultState = {
      projects: [
        aProject({ id: 'proj_1', name: 'Project Alpha' }),
      ],
      setProjects,
      tasks: [
        aTask({ id: 'task_1', projectId: 'proj_1', name: 'Task One', completed: false }),
        aTask({ id: 'task_2', projectId: 'proj_1', name: 'Task Two', completed: true }),
      ],
      setTasks,
      logs: [],
      setLogs,
      holidays: [],
      setHolidays: vi.fn(),
      patches: [],
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

    return {
      ...utils,
      setTasks,
      setLogs,
    };
  };

  it('should handle editing and saving task changes when editing task', () => {
    const { setTasks } = setup();

    const tasksTableWrapper = screen.getByText(/tasks table/i).closest('.border');
    const editBtn = tasksTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const nameInput = tasksTableWrapper?.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Task One Edited' } });

    const completedCheckbox = screen.getByRole('checkbox', { name: /Completed/i });
    fireEvent.click(completedCheckbox);

    const reasonInput = screen.getByRole('textbox', { name: /Reason/i });
    fireEvent.change(reasonInput, { target: { value: 'Done with task' } });

    const saveBtn = tasksTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setTasks).toHaveBeenCalled();
  });

  it('should delete task and associated logs when task deletion is confirmed in dialog', async () => {
    const { setTasks, setLogs } = setup();

    const tasksTableWrapper = screen.getByText(/tasks table/i).closest('.border');
    const deleteBtn = tasksTableWrapper?.querySelector('tbody tr button:last-child') as HTMLElement;
    fireEvent.click(deleteBtn);

    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog).not.toBeNull();
    const confirmBtn = within(dialog as HTMLElement).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(setTasks).toHaveBeenCalled();
      expect(setLogs).toHaveBeenCalled();
    });
  });
});

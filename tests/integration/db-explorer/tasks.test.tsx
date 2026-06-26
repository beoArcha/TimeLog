// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { OxyContext } from '@common/providers/OxyContext';
import { LocaleProvider } from '@common/providers/LocaleProvider';

describe('Integration Tests: DbExplorer Tasks Table', () => {
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
    const setProjects = vi.fn();
    const setTasks = vi.fn();
    const setLogs = vi.fn();

    const defaultState = {
      projects: [
        { id: 'proj_1', name: 'Project Alpha', color: 'rose', createdAt: '2026-06-12T00:00:00Z' },
      ],
      setProjects,
      tasks: [
        { id: 'task_1', projectId: 'proj_1', parentTaskId: null, name: 'Task One', createdAt: '2026-06-12T00:00:00Z', completed: false },
        { id: 'task_2', projectId: 'proj_1', parentTaskId: null, name: 'Task Two', createdAt: '2026-06-12T00:00:00Z', completed: true },
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
      setTasks,
      setLogs,
    };
  };

  it('should_handle_editing_and_saving_task_changes_when_editing_task', () => {
    const { setTasks } = setup();

    const tasksTableWrapper = screen.getByText(/tasks table/i).closest('.border');
    const editBtn = tasksTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const nameInput = tasksTableWrapper?.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Task One Edited' } });

    const completedCheckbox = tasksTableWrapper?.querySelector('input[type="checkbox"]') as HTMLInputElement;
    fireEvent.click(completedCheckbox); // toggle completion

    const reasonInput = tasksTableWrapper?.querySelector('input[placeholder="Powód (reason)"]') as HTMLInputElement;
    fireEvent.change(reasonInput, { target: { value: 'Done with task' } });

    const saveBtn = tasksTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setTasks).toHaveBeenCalled();
  });

  it('should_delete_task_when_task_deletion_is_confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { setTasks, setLogs } = setup();

    const tasksTableWrapper = screen.getByText(/tasks table/i).closest('.border');
    const deleteBtn = tasksTableWrapper?.querySelector('tbody tr button:last-child') as HTMLElement;
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(setTasks).toHaveBeenCalled();
    expect(setLogs).toHaveBeenCalled();
  });
});

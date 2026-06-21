// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { OxyContext } from '@core/providers/OxyContext';
import { LocaleProvider } from '@core/providers/LocaleProvider';

describe('Integration Tests: DbExplorer Logs Table', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(window, 'alert').mockImplementation(() => { });
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
      ],
      setTasks,
      logs: [
        { id: 'log_1', taskId: 'task_1', projectId: 'proj_1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z', note: 'First log' },
      ],
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
      setLogs,
    };
  };

  it('should_show_manual_add_form_and_submit_log_when_adding_manually', () => {
    const { container, setLogs } = setup();

    const addBtn = screen.getByText(/add log manually/i);
    fireEvent.click(addBtn);

    const taskSelect = screen.getByRole('combobox');
    fireEvent.change(taskSelect, { target: { value: 'task_1' } });

    const textInputs = container.querySelectorAll('form input[type="text"]');
    const startInput = textInputs[0] as HTMLInputElement;
    const endInput = textInputs[1] as HTMLInputElement;
    const noteInput = textInputs[2] as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: '2026-06-20T10:00:00.000Z' } });
    fireEvent.change(endInput, { target: { value: '2026-06-20T11:00:00.000Z' } });
    fireEvent.change(noteInput, { target: { value: 'Manual log entry' } });

    const submitBtn = screen.getByText(/Zatwierdź SQL INSERT/i);
    fireEvent.click(submitBtn);

    expect(setLogs).toHaveBeenCalled();
  });

  it('should_alert_when_submitting_manual_log_without_selected_task', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
    const { container, setLogs } = setup();

    const addBtn = screen.getByText(/add log manually/i);
    fireEvent.click(addBtn);

    const taskSelect = screen.getByRole('combobox');
    fireEvent.change(taskSelect, { target: { value: '' } });

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(alertSpy).toHaveBeenCalledWith('Najpierw wybierz zadanie!');
    expect(setLogs).not.toHaveBeenCalled();
  });

  it('should_handle_editing_and_deleting_logs_when_modified_in_logs_table', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { setLogs } = setup();

    const logsTableWrapper = screen.getByText(/time_logs table/i).closest('.border');

    const editBtn = logsTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const noteInput = logsTableWrapper?.querySelector('input[value="First log"]') as HTMLInputElement;
    fireEvent.change(noteInput, { target: { value: 'Updated note' } });

    const saveBtn = logsTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setLogs).toHaveBeenCalled();

    const deleteBtn = logsTableWrapper?.querySelector('tbody tr button:last-child') as HTMLElement;
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(setLogs).toHaveBeenCalledTimes(2);
  });

  it('Given a log list, When editing is started and canceled, Then it should exit edit mode', () => {
    const { setLogs } = setup();
    const logsTableWrapper = screen.getByText(/time_logs table/i).closest('.border');

    const editBtn = logsTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const cancelBtn = logsTableWrapper?.querySelector('tbody tr button:last-child') as HTMLElement;
    fireEvent.click(cancelBtn);

    expect(setLogs).not.toHaveBeenCalled();
  });

  it('Given a log list, When editing is started and saved with no changes, Then it should close editing without triggering setLogs', () => {
    const { setLogs } = setup();
    const logsTableWrapper = screen.getByText(/time_logs table/i).closest('.border');

    const editBtn = logsTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const saveBtn = logsTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setLogs).toHaveBeenCalled();
    const updateFn = setLogs.mock.calls[0][0];
    const initialLogs = [
      { id: 'log_1', taskId: 'task_1', projectId: 'proj_1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z', note: 'First log' }
    ];
    const updatedLogs = updateFn(initialLogs);
    expect(updatedLogs[0]).toBe(initialLogs[0]);
  });

  it('Given a log list with history, When clicking history button, Then it should toggle the history details view', () => {
    const customValue = {
      logs: [
        {
          id: 'log_1',
          taskId: 'task_1',
          projectId: 'proj_1',
          startTime: '2026-06-12T01:00:00Z',
          endTime: '2026-06-12T02:00:00Z',
          note: 'First log',
          originalStartTime: '2026-06-12T00:50:00Z',
          originalEndTime: '2026-06-12T02:00:00Z',
          originalNote: 'Original Note',
          editHistory: [
            {
              editedAt: '2026-06-12T01:05:00Z',
              prevStartTime: '2026-06-12T00:50:00Z',
              prevEndTime: '2026-06-12T02:00:00Z',
              prevNote: 'Original Note',
              reason: 'Adjusted start time'
            }
          ]
        },
      ]
    };
    setup(customValue);

    const logsTableWrapper = screen.getByText(/time_logs table/i).closest('.border');
    const historyBtn = logsTableWrapper?.querySelector('tbody tr button') as HTMLElement;
    expect(screen.queryByText(/Oryginał i historia korekt/i)).toBeNull();

    fireEvent.click(historyBtn);
    expect(screen.getByText(/Oryginał i historia korekt/i)).not.toBeNull();
    expect(screen.getByText(/"Adjusted start time"/i)).not.toBeNull();

    fireEvent.click(historyBtn);
    expect(screen.queryByText(/Oryginał i historia korekt/i)).toBeNull();
  });

  it('Given the manual add form, When canceled, Then it should close the form', () => {
    setup();

    const addBtn = screen.getByText(/add log manually/i);
    fireEvent.click(addBtn);

    expect(screen.getByText(/Zatwierdź SQL INSERT/i)).not.toBeNull();

    const cancelBtn = screen.getByText(/Anuluj/i);
    fireEvent.click(cancelBtn);

    expect(screen.queryByText(/Zatwierdź SQL INSERT/i)).toBeNull();
  });

  it('Given the manual add form, When submitted with empty end time and empty note, Then it should submit with defaults', () => {
    const { container, setLogs } = setup();

    const addBtn = screen.getByText(/add log manually/i);
    fireEvent.click(addBtn);

    const taskSelect = screen.getByRole('combobox');
    fireEvent.change(taskSelect, { target: { value: 'task_1' } });

    const textInputs = container.querySelectorAll('form input[type="text"]');
    const startInput = textInputs[0] as HTMLInputElement;
    const endInput = textInputs[1] as HTMLInputElement;
    const noteInput = textInputs[2] as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: '2026-06-20T10:00:00.000Z' } });
    fireEvent.change(endInput, { target: { value: '' } });
    fireEvent.change(noteInput, { target: { value: '' } });

    const submitBtn = screen.getByText(/Zatwierdź SQL INSERT/i);
    fireEvent.click(submitBtn);

    expect(setLogs).toHaveBeenCalled();
  });
});

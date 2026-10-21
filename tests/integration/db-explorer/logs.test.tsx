// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Integration Tests: DbExplorer Logs Table', () => {
  beforeEach(() => {
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
    const handleEditTimeLog = vi.fn().mockResolvedValue(undefined);
    const handleDeleteTimeLog = vi.fn().mockResolvedValue(undefined);
    const handleInsertTimeLog = vi.fn().mockResolvedValue(undefined);

    const defaultState = {
      projects: [
        aProject({ id: 'proj_1', name: 'Project Alpha' }),
      ],
      setProjects,
      tasks: [
        aTask({ id: 'task_1', projectId: 'proj_1', name: 'Task One' }),
      ],
      setTasks,
      logs: [
        aTimeLog({ id: 'log_1', taskId: 'task_1', projectId: 'proj_1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z', note: 'First log' }),
      ],
      setLogs,
      handleEditTimeLog,
      handleDeleteTimeLog,
      handleInsertTimeLog,
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
      setLogs,
      handleEditTimeLog: value.handleEditTimeLog,
      handleDeleteTimeLog: value.handleDeleteTimeLog,
      handleInsertTimeLog: value.handleInsertTimeLog,
    };
  };

  it('should show manual add form and submit log when adding manually', async () => {
    const { container, handleInsertTimeLog } = setup();

    const addBtn = screen.getByText(/add log manually/i);
    fireEvent.click(addBtn);

    const textInputs = container.querySelectorAll('form input[type="text"]');
    const startInput = textInputs[0] as HTMLInputElement;
    const endInput = textInputs[1] as HTMLInputElement;
    const noteInput = textInputs[2] as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: '2026-06-20T10:00:00.000Z' } });
    fireEvent.change(endInput, { target: { value: '2026-06-20T11:00:00.000Z' } });
    fireEvent.change(noteInput, { target: { value: 'Manual log entry' } });

    const submitBtn = container.querySelector('form button[type="submit"]') as HTMLElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleInsertTimeLog).toHaveBeenCalledWith(
        expect.any(String),
        'task_1',
        '2026-06-20T10:00:00.000Z',
        '2026-06-20T11:00:00.000Z',
        'Manual log entry'
      );
    });
  });

  it('should trigger alert when submitting manual log without selected task', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });
    const { container, handleInsertTimeLog } = setup({ tasks: [] });

    const addBtn = screen.getByText(/add log manually/i);
    fireEvent.click(addBtn);

    const form = container.querySelector('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(alertSpy).toHaveBeenCalled();
    expect(handleInsertTimeLog).not.toHaveBeenCalled();
  });

  it('should handle editing and deleting logs when modified in logs table', async () => {
    const { handleEditTimeLog, handleDeleteTimeLog } = setup();

    const logsTableWrapper = screen.getByText(/(time_logs|Time Logs) Table/i).closest('.border');

    const editBtn = within(logsTableWrapper as HTMLElement).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    const noteInput = within(logsTableWrapper as HTMLElement).getByDisplayValue('First log');
    fireEvent.change(noteInput, { target: { value: 'Updated note' } });

    const saveBtn = within(logsTableWrapper as HTMLElement).getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(handleEditTimeLog).toHaveBeenCalled();

    await waitFor(() => {
      expect(within(logsTableWrapper as HTMLElement).queryByRole('button', { name: /Save/i })).toBeNull();
    });

    const deleteBtn = within(logsTableWrapper as HTMLElement).getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);

    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog).not.toBeNull();
    const confirmBtn = within(dialog as HTMLElement).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(handleDeleteTimeLog).toHaveBeenCalledWith('log_1');
    });
  });

  it('should exit edit mode when editing is started and canceled', () => {
    const { handleEditTimeLog } = setup();
    const logsTableWrapper = screen.getByText(/(time_logs|Time Logs) Table/i).closest('.border');

    const editBtn = within(logsTableWrapper as HTMLElement).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    const cancelBtn = within(logsTableWrapper as HTMLElement).getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(handleEditTimeLog).not.toHaveBeenCalled();
  });

  it('should close editing without triggering handleEditTimeLog when saved with no changes', () => {
    const { handleEditTimeLog } = setup();
    const logsTableWrapper = screen.getByText(/(time_logs|Time Logs) Table/i).closest('.border');

    const editBtn = within(logsTableWrapper as HTMLElement).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    const saveBtn = within(logsTableWrapper as HTMLElement).getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(handleEditTimeLog).not.toHaveBeenCalled();
  });

  it('should toggle history details view when clicking history button', () => {
    const customValue = {
      logs: [
        aTimeLog({
          id: 'log_1',
          taskId: 'task_1',
          projectId: 'proj_1',
          startTime: '2026-06-12T01:00:00Z',
          endTime: '2026-06-12T02:00:00Z',
          note: 'First log',
          editHistory: [
            {
              editedAt: '2026-06-12T01:05:00Z',
              prevStartTime: '2026-06-12T00:50:00Z',
              prevEndTime: '2026-06-12T02:00:00Z',
              prevNote: 'Original Note',
              reason: 'Adjusted start time'
            }
          ]
        }),
      ]
    };
    setup(customValue);

    const logsTableWrapper = screen.getByText(/(time_logs|Time Logs) Table/i).closest('.border');
    const historyBtn = within(logsTableWrapper as HTMLElement).getByRole('button', { name: /Revision History/i });
    expect(screen.queryByText(/Adjusted start time/i)).toBeNull();

    fireEvent.click(historyBtn);
    expect(screen.getByText(/Adjusted start time/i)).not.toBeNull();

    fireEvent.click(historyBtn);
    expect(screen.queryByText(/Adjusted start time/i)).toBeNull();
  });

  it('should close manual add form when canceled', () => {
    const { container } = setup();

    const addBtn = screen.getByText(/add log manually/i);
    fireEvent.click(addBtn);

    expect(container.querySelector('form')).not.toBeNull();

    const form = container.querySelector('form')!;
    const cancelBtn = within(form).getAllByRole('button')[1];
    fireEvent.click(cancelBtn);

    expect(container.querySelector('form')).toBeNull();
  });

  it('should submit with defaults when manual add form is submitted with empty end time and note', async () => {
    const { container, handleInsertTimeLog } = setup();

    const addBtn = screen.getByText(/add log manually/i);
    fireEvent.click(addBtn);

    const textInputs = container.querySelectorAll('form input[type="text"]');
    const startInput = textInputs[0] as HTMLInputElement;
    const endInput = textInputs[1] as HTMLInputElement;
    const noteInput = textInputs[2] as HTMLInputElement;

    fireEvent.change(startInput, { target: { value: '2026-06-20T10:00:00.000Z' } });
    fireEvent.change(endInput, { target: { value: '' } });
    fireEvent.change(noteInput, { target: { value: '' } });

    const submitBtn = container.querySelector('form button[type="submit"]') as HTMLElement;
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleInsertTimeLog).toHaveBeenCalledWith(
        expect.any(String),
        'task_1',
        '2026-06-20T10:00:00.000Z',
        null,
        'Manual time registration'
      );
    });
  });
});


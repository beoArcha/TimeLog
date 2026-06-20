// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '../src/components/features/db-explorer/DbExplorer';
import { OxyContext } from '../src/hooks/useOxyFlow';
import { LocaleProvider } from '../src/providers/LocaleProvider';

describe('DbExplorer and Table Components Tests', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    vi.spyOn(window, 'prompt').mockImplementation(() => 'Mock Prompt Val');

    // Mock URL.createObjectURL and revokeObjectURL for export database
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
    const setHolidays = vi.fn();
    const setPatches = vi.fn();

    const defaultState = {
      projects: [
        { id: 'proj_1', name: 'Project Alpha', color: 'rose', createdAt: '2026-06-12T00:00:00Z' },
        { id: 'proj_2', name: 'Project Beta', color: 'indigo', createdAt: '2026-06-12T00:00:00Z' },
      ],
      setProjects,
      tasks: [
        { id: 'task_1', projectId: 'proj_1', parentTaskId: null, name: 'Task One', createdAt: '2026-06-12T00:00:00Z', completed: false },
        { id: 'task_2', projectId: 'proj_1', parentTaskId: null, name: 'Task Two', createdAt: '2026-06-12T00:00:00Z', completed: true },
      ],
      setTasks,
      logs: [
        { id: 'log_1', taskId: 'task_1', projectId: 'proj_1', startTime: '2026-06-12T01:00:00Z', endTime: '2026-06-12T02:00:00Z', note: 'First log' },
      ],
      setLogs,
      holidays: [
        { id: 'leave_1', date: '2026-12-25', type: 'holiday', name: 'Christmas' },
      ],
      setHolidays,
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
      setProjects,
      setTasks,
      setLogs,
      setHolidays,
      setPatches,
    };
  };

  it('renders DbExplorer correctly with all table cards', () => {
    setup();

    expect(screen.getByText(/Tables Manager/i)).toBeDefined();
    expect(screen.getByText(/projects table/i)).toBeDefined();
    expect(screen.getByText(/tasks table/i)).toBeDefined();
    expect(screen.getByText(/time_logs table/i)).toBeDefined();
    expect(screen.getByText(/holidays_leaves table/i)).toBeDefined();
    expect(screen.getByText(/patch_logs table/i)).toBeDefined();

    // Verify initial values render
    expect(screen.getByText('Project Alpha')).toBeDefined();
    expect(screen.getByText('Project Beta')).toBeDefined();
    expect(screen.getByText('Task One')).toBeDefined();
    expect(screen.getByText('Task Two')).toBeDefined();
    expect(screen.getByText('First log')).toBeDefined();
    expect(screen.getByText('Christmas')).toBeDefined();
    expect(screen.getByText('Patch one')).toBeDefined();
  });

  it('projects table: handles starting edit, changing fields, and saving edit', () => {
    const { setProjects } = setup();

    // Click edit on Project Alpha
    const editBtns = screen.getAllByTitle(/Modyfikuj/i);
    fireEvent.click(editBtns[0]); // first modyfikuj button is on Project Alpha

    // Find input for name and change it
    const nameInput = screen.getByDisplayValue('Project Alpha');
    fireEvent.change(nameInput, { target: { value: 'Project Alpha Edited' } });

    // Find select for color and change it
    const colorSelect = screen.getByDisplayValue('rose');
    fireEvent.change(colorSelect, { target: { value: 'indigo' } });

    // Find reason input
    const reasonInput = screen.getByPlaceholderText(/Powód zmiany/i);
    fireEvent.change(reasonInput, { target: { value: 'Reason for project change' } });

    // Click save
    const saveBtn = screen.getByTitle(/Zapisz/i);
    fireEvent.click(saveBtn);

    expect(setProjects).toHaveBeenCalled();
  });

  it('projects table: cancels editing without changes', () => {
    const { setProjects } = setup();

    const editBtns = screen.getAllByTitle(/Modyfikuj/i);
    fireEvent.click(editBtns[0]);

    const cancelBtn = screen.getByTitle(/Anuluj/i);
    fireEvent.click(cancelBtn);

    expect(setProjects).not.toHaveBeenCalled();
  });

  it('projects table: handles deleting a project with confirmation', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { setProjects, setTasks, setLogs } = setup();

    const deleteBtns = screen.getAllByTitle(/Wycofaj/i);
    fireEvent.click(deleteBtns[0]); // first project delete

    expect(confirmSpy).toHaveBeenCalled();
    expect(setProjects).toHaveBeenCalled();
    expect(setTasks).toHaveBeenCalled();
    expect(setLogs).toHaveBeenCalled();
  });

  it('projects table: shows and toggles edit history panel if project has history', () => {
    const projectWithHistory = [
      {
        id: 'proj_1',
        name: 'Project Alpha',
        color: 'rose',
        createdAt: '2026-06-12T00:00:00Z',
        originalName: 'Original Alpha',
        editHistory: [
          { editedAt: '2026-06-13T00:00:00Z', prevName: 'Original Alpha', prevColor: 'teal', reason: 'Initial fix' }
        ]
      }
    ];

    setup({ projects: projectWithHistory });

    expect(screen.getByText(/Oryginał: Original Alpha/i)).toBeDefined();

    const historyBtn = screen.getByTitle(/Zobacz historię rewizji/i);
    fireEvent.click(historyBtn);

    expect(screen.getByText(/Historia poprawek obiektu/i)).toBeDefined();
    expect(screen.getByText(/Initial fix/i)).toBeDefined();

    // Close it
    fireEvent.click(historyBtn);
    expect(screen.queryByText(/Historia poprawek obiektu/i)).toBeNull();
  });

  it('tasks table: handles editing and saving task changes', () => {
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

  it('tasks table: handles deleting a task', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { setTasks, setLogs } = setup();

    const tasksTableWrapper = screen.getByText(/tasks table/i).closest('.border');
    const deleteBtn = tasksTableWrapper?.querySelector('tbody tr button:last-child') as HTMLElement;
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(setTasks).toHaveBeenCalled();
    expect(setLogs).toHaveBeenCalled();
  });

  it('time_logs table: handles showing the manual add form and submitting it', () => {
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

    // Submit form
    const submitBtn = screen.getByText(/Zatwierdź SQL INSERT/i);
    fireEvent.click(submitBtn);

    expect(setLogs).toHaveBeenCalled();
  });

  it('time_logs table: alerts when submitting manual log without selected task', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
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

  it('time_logs table: handles editing and deleting logs', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { setLogs } = setup();

    const logsTableWrapper = screen.getByText(/time_logs table/i).closest('.border');
    
    // Test Edit
    const editBtn = logsTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const noteInput = logsTableWrapper?.querySelector('input[value="First log"]') as HTMLInputElement;
    fireEvent.change(noteInput, { target: { value: 'Updated note' } });

    const saveBtn = logsTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setLogs).toHaveBeenCalled();

    // Test Delete
    const deleteBtn = logsTableWrapper?.querySelector('tbody tr button:last-child') as HTMLElement;
    fireEvent.click(deleteBtn);

    expect(confirmSpy).toHaveBeenCalled();
    expect(setLogs).toHaveBeenCalledTimes(2);
  });

  it('holidays_leaves table: handles adding a new holiday entry', () => {
    const { setHolidays } = setup();

    const addLeaveBtn = screen.getByText(/\+ Add Leave/i);
    fireEvent.click(addLeaveBtn);

    expect(setHolidays).toHaveBeenCalled();
  });

  it('holidays_leaves table: handles editing holiday entries', () => {
    const { setHolidays } = setup();

    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    // Click edit
    const editBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const nameInput = holidaysTableWrapper?.querySelector('input[value="Christmas"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Christmas Holiday' } });

    const saveBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setHolidays).toHaveBeenCalled();
  });

  it('patch_logs table: handles manual patch adding and deleting', () => {
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

  it('export database: simulates download click', () => {
    setup();

    const exportBtn = screen.getByText(/export database/i);
    
    // Spy on link creation and click inside document
    const clickSpy = vi.fn();
    const mockLink = {
      href: '',
      download: '',
      click: clickSpy
    };
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);

    fireEvent.click(exportBtn);

    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(mockLink.download).toContain('OxyFlow_Backup_');
    expect(clickSpy).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalled();
  });
});

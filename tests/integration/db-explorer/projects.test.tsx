import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { LocaleProvider } from '@common/hooks/LocaleProvider';

describe('Integration Tests: DbExplorer Projects Table', () => {
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
      ],
      setTasks,
      logs: [],
      setLogs,
      holidays: [],
      setHolidays,
      patches: [],
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
        <MockProviders state={value as any}>
          <DbExplorer />
        </MockProviders>
      </LocaleProvider>
    );

    return {
      ...utils,
      setProjects,
      setTasks,
      setLogs,
    };
  };

  it('should_render_correctly_with_all_table_cards_when_rendered', () => {
    setup();
    expect(screen.getByText(/Tables Manager/i)).toBeDefined();
    expect(screen.getByText(/projects table/i)).toBeDefined();
    expect(screen.getByText('Project Alpha')).toBeDefined();
    expect(screen.getByText('Project Beta')).toBeDefined();
  });

  it('should_handle_starting_edit_changing_fields_and_saving_edit_when_editing_project', () => {
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

  it('should_cancel_editing_without_changes_when_canceling_project_edit', () => {
    const { setProjects } = setup();

    const editBtns = screen.getAllByTitle(/Modyfikuj/i);
    fireEvent.click(editBtns[0]);

    const cancelBtn = screen.getByTitle(/Anuluj/i);
    fireEvent.click(cancelBtn);

    expect(setProjects).not.toHaveBeenCalled();
  });

  it('should_delete_project_and_related_tasks_and_logs_when_project_deletion_is_confirmed', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { setProjects, setTasks, setLogs } = setup();

    const deleteBtns = screen.getAllByTitle(/Wycofaj/i);
    fireEvent.click(deleteBtns[0]); // first project delete

    expect(confirmSpy).toHaveBeenCalled();
    expect(setProjects).toHaveBeenCalled();
    expect(setTasks).toHaveBeenCalled();
    expect(setLogs).toHaveBeenCalled();
  });

  it('should_show_and_toggle_edit_history_panel_when_project_has_history_and_history_button_is_clicked', () => {
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
});

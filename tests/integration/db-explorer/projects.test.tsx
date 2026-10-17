// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup, within, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask } from '@tests/shared/builders/entity-builders';

describe('Integration Tests: DbExplorer Projects Table', () => {
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
    const setHolidays = vi.fn();
    const setPatches = vi.fn();

    const defaultState = {
      projects: [
        aProject({ id: 'proj_1', name: 'Project Alpha', color: 'rose' }),
        aProject({ id: 'proj_2', name: 'Project Beta', color: 'indigo' }),
      ],
      setProjects,
      tasks: [
        aTask({ id: 'task_1', projectId: 'proj_1', name: 'Task One' }),
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
        <MockProviders state={value}>
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

  it('should render table cards with projects when initialized', () => {
    setup();
    expect(screen.getByText('Project Alpha')).toBeDefined();
    expect(screen.getByText('Project Beta')).toBeDefined();
  });

  it('should update project fields and save edit when editing project', () => {
    const { setProjects } = setup();

    const editBtns = screen.getAllByRole('button', { name: /Edit/i });
    fireEvent.click(editBtns[0]);

    const nameInput = screen.getByDisplayValue('Project Alpha');
    fireEvent.change(nameInput, { target: { value: 'Project Alpha Edited' } });

    const colorSelect = screen.getByDisplayValue('rose');
    fireEvent.change(colorSelect, { target: { value: 'indigo' } });

    const reasonInput = screen.getByRole('textbox', { name: /Reason/i });
    fireEvent.change(reasonInput, { target: { value: 'Reason for project change' } });

    const saveBtn = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(setProjects).toHaveBeenCalled();
  });

  it('should cancel editing without changes when cancel button is clicked', () => {
    const { setProjects } = setup();

    const editBtns = screen.getAllByRole('button', { name: /Edit/i });
    fireEvent.click(editBtns[0]);

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(setProjects).not.toHaveBeenCalled();
  });

  it('should delete project and related tasks and logs when deletion is confirmed in dialog', async () => {
    const { setProjects, setTasks, setLogs } = setup();

    const deleteBtns = screen.getAllByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtns[0]);

    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog).not.toBeNull();
    const confirmBtn = within(dialog as HTMLElement).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(setProjects).toHaveBeenCalled();
      expect(setTasks).toHaveBeenCalled();
      expect(setLogs).toHaveBeenCalled();
    });
  });

  it('should toggle edit history audit trail when revision history button is clicked', () => {
    const projectWithHistory = [
      aProject({
        id: 'proj_1',
        name: 'Project Alpha',
        color: 'rose',
        originalName: 'Original Alpha',
        editHistory: [
          { editedAt: '2026-06-13T00:00:00Z', prevName: 'Original Alpha', prevColor: 'teal', reason: 'Initial fix' }
        ]
      })
    ];

    setup({ projects: projectWithHistory });

    expect(screen.getByText(/Original Alpha/i)).toBeDefined();

    const historyBtn = screen.getByRole('button', { name: /Revision History/i });
    fireEvent.click(historyBtn);

    expect(screen.getByText(/Initial fix/i)).toBeDefined();

    fireEvent.click(historyBtn);
    expect(screen.queryByText(/Initial fix/i)).toBeNull();
  });
});

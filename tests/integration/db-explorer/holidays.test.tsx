// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aHolidayLeave } from '@tests/shared/builders/entity-builders';

describe('Integration Tests: DbExplorer Holidays Table', () => {
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
    const setHolidays = vi.fn();
    const handleAddHoliday = vi.fn().mockResolvedValue(undefined);
    const handleUpdateHoliday = vi.fn().mockResolvedValue(undefined);
    const handleDeleteHoliday = vi.fn().mockResolvedValue(undefined);

    const defaultState = {
      projects: [],
      tasks: [],
      logs: [],
      holidays: [
        aHolidayLeave({ id: 'leave_1', date: '2026-12-25', type: 'holiday', name: 'Christmas' }),
      ],
      setHolidays,
      handleAddHoliday,
      handleUpdateHoliday,
      handleDeleteHoliday,
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
      setHolidays,
      handleAddHoliday: value.handleAddHoliday,
      handleUpdateHoliday: value.handleUpdateHoliday,
      handleDeleteHoliday: value.handleDeleteHoliday,
    };
  };

  it('should add new holiday entry when add leave button is clicked', () => {
    const { handleAddHoliday } = setup();

    const addLeaveBtn = screen.getByText(/\+ Add Leave/i);
    fireEvent.click(addLeaveBtn);

    expect(handleAddHoliday).toHaveBeenCalledWith(
      expect.any(String),
      'holiday',
      expect.any(String)
    );
  });

  it('should update holiday entry when saved in holidays table', () => {
    const { handleUpdateHoliday } = setup();

    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = within(holidaysTableWrapper as HTMLElement).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    const nameInput = within(holidaysTableWrapper as HTMLElement).getByDisplayValue('Christmas');
    fireEvent.change(nameInput, { target: { value: 'Christmas Holiday' } });

    const saveBtn = within(holidaysTableWrapper as HTMLElement).getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(handleUpdateHoliday).toHaveBeenCalledWith(
      'leave_1',
      '2026-12-25',
      'holiday',
      'Christmas Holiday',
      expect.any(String)
    );
  });

  it('should cancel editing when cancel button is clicked', () => {
    const { handleUpdateHoliday } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = within(holidaysTableWrapper as HTMLElement).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);
    const cancelBtn = within(holidaysTableWrapper as HTMLElement).getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelBtn);

    expect(handleUpdateHoliday).not.toHaveBeenCalled();
  });

  it('should delete holiday when delete button is clicked and confirmed in dialog', () => {
    const { handleDeleteHoliday } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const deleteBtn = within(holidaysTableWrapper as HTMLElement).getByRole('button', { name: /Delete/i });
    fireEvent.click(deleteBtn);

    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog).not.toBeNull();
    const confirmBtn = within(dialog as HTMLElement).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmBtn);

    expect(handleDeleteHoliday).toHaveBeenCalledWith('leave_1');
  });

  it('should close editing without updating holidays when no changes are made and saved', () => {
    const { handleUpdateHoliday } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = within(holidaysTableWrapper as HTMLElement).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    const saveBtn = within(holidaysTableWrapper as HTMLElement).getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(handleUpdateHoliday).not.toHaveBeenCalled();
  });

  it('should trigger update when type is changed and reason is entered', () => {
    const { handleUpdateHoliday } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = within(holidaysTableWrapper as HTMLElement).getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    const select = holidaysTableWrapper?.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'leave' } });
    const reasonInput = screen.getByLabelText(/Reason for modification/i);
    fireEvent.change(reasonInput, { target: { value: 'Custom reason text' } });

    const saveBtn = within(holidaysTableWrapper as HTMLElement).getByRole('button', { name: /Save/i });
    fireEvent.click(saveBtn);

    expect(handleUpdateHoliday).toHaveBeenCalledWith(
      'leave_1',
      '2026-12-25',
      'leave',
      'Christmas',
      'Custom reason text'
    );
  });

  it('should toggle history details view when clicking history button', () => {
    const customValue = {
      holidays: [
        aHolidayLeave({
          id: 'leave_1',
          date: '2026-12-25',
          type: 'holiday',
          name: 'Christmas',
          originalName: 'Xmas',
          originalDate: '2026-12-25',
          originalType: 'holiday',
          editHistory: [
            {
              editedAt: '2026-06-20T12:00:00Z',
              prevName: 'Xmas',
              prevDate: '2026-12-25',
              prevType: 'holiday',
              reason: 'Initial Correction'
            }
          ]
        }),
      ]
    };
    setup(customValue);

    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');
    const historyBtn = within(holidaysTableWrapper as HTMLElement).getByRole('button', { name: /Revision History/i });
    expect(screen.queryByText(/Audit Trail/i)).toBeNull();

    fireEvent.click(historyBtn);
    expect(screen.getByText(/Audit Trail/i)).not.toBeNull();
    expect(screen.getByText(/"Initial Correction"/i)).not.toBeNull();

    fireEvent.click(historyBtn);
    expect(screen.queryByText(/Audit Trail/i)).toBeNull();
  });
});


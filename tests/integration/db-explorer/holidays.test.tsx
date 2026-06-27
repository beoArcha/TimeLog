// @vitest-environment jsdom
import React from 'react';
import { render, fireEvent, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DbExplorer from '@features/db-explorer/DbExplorer';
import { OxyContext } from '@common/hooks/OxyContext';
import { LocaleProvider } from '@common/hooks/LocaleProvider';

describe('Integration Tests: DbExplorer Holidays Table', () => {
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
    const setHolidays = vi.fn();

    const defaultState = {
      projects: [],
      tasks: [],
      logs: [],
      holidays: [
        { id: 'leave_1', date: '2026-12-25', type: 'holiday', name: 'Christmas' },
      ],
      setHolidays,
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
      setHolidays,
    };
  };

  it('should_add_new_holiday_entry_when_add_leave_is_clicked', () => {
    const { setHolidays } = setup();

    const addLeaveBtn = screen.getByText(/\+ Add Leave/i);
    fireEvent.click(addLeaveBtn);

    expect(setHolidays).toHaveBeenCalled();
  });

  it('should_edit_holiday_entries_when_saved_in_holidays_table', () => {
    const { setHolidays } = setup();

    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const nameInput = holidaysTableWrapper?.querySelector('input[value="Christmas"]') as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Christmas Holiday' } });

    const saveBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setHolidays).toHaveBeenCalled();
  });

  it('should_cancel_editing_when_anuluj_is_clicked', () => {
    const { setHolidays } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);
    const cancelBtn = holidaysTableWrapper?.querySelector('tbody tr button:last-child') as HTMLElement;
    fireEvent.click(cancelBtn);

    expect(setHolidays).not.toHaveBeenCalled();
  });

  it('should_delete_holiday_when_wycofaj_is_clicked', () => {
    const { setHolidays } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const deleteBtn = holidaysTableWrapper?.querySelector('tbody tr button:last-child') as HTMLElement;
    fireEvent.click(deleteBtn);

    expect(setHolidays).toHaveBeenCalled();
  });

  it('Given a holiday list, When editing is started and no changes are made and saved, Then it should close editing without updating holidays', () => {
    const { setHolidays } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const saveBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setHolidays).toHaveBeenCalled();
    const updateFn = setHolidays.mock.calls[0][0];
    const initialHolidays = [
      { id: 'leave_1', date: '2026-12-25', type: 'holiday', name: 'Christmas' }
    ];
    const updatedHolidays = updateFn(initialHolidays);
    expect(updatedHolidays[0]).toBe(initialHolidays[0]);
  });

  it('Given a holiday list, When type is changed and custom reason is entered and saved, Then it should trigger setHolidays with update and new history entry', () => {
    const { setHolidays } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const select = holidaysTableWrapper?.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'leave' } });
    const reasonInput = holidaysTableWrapper?.querySelector('input[placeholder="Powód zmiany"]') as HTMLInputElement;
    fireEvent.change(reasonInput, { target: { value: 'Custom reason text' } });

    const saveBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setHolidays).toHaveBeenCalled();
  });

  it('Given a holiday with history, When clicking history button, Then it should toggle the history details view', () => {
    const customValue = {
      holidays: [
        {
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
        },
      ]
    };
    setup(customValue);

    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');
    const historyBtn = holidaysTableWrapper?.querySelector('tbody tr button') as HTMLElement;
    expect(screen.queryByText(/Audit historii/i)).toBeNull();

    fireEvent.click(historyBtn);
    expect(screen.getByText(/Audit historii/i)).not.toBeNull();
    expect(screen.getByText(/"Initial Correction"/i)).not.toBeNull();

    fireEvent.click(historyBtn);
    expect(screen.queryByText(/Audit historii/i)).toBeNull();
  });
});

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

    const defaultState = {
      projects: [],
      tasks: [],
      logs: [],
      holidays: [
        aHolidayLeave({ id: 'leave_1', date: '2026-12-25', type: 'holiday', name: 'Christmas' }),
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
    };
  };

  it('should add new holiday entry when add leave button is clicked', () => {
    const { setHolidays } = setup();

    const addLeaveBtn = screen.getByText(/\+ Add Leave/i);
    fireEvent.click(addLeaveBtn);

    expect(setHolidays).toHaveBeenCalled();
  });

  it('should update holiday entry when saved in holidays table', () => {
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

  it('should cancel editing when cancel button is clicked', () => {
    const { setHolidays } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);
    const cancelBtn = holidaysTableWrapper?.querySelector('tbody tr button:last-child') as HTMLElement;
    fireEvent.click(cancelBtn);

    expect(setHolidays).not.toHaveBeenCalled();
  });

  it('should delete holiday when delete button is clicked and confirmed in dialog', () => {
    const { setHolidays } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const deleteBtn = holidaysTableWrapper?.querySelector('tbody tr button:last-child') as HTMLElement;
    fireEvent.click(deleteBtn);

    const dialog = document.querySelector('[role="alertdialog"]')!;
    expect(dialog).not.toBeNull();
    const confirmBtn = within(dialog as HTMLElement).getByRole('button', { name: /Delete/i });
    fireEvent.click(confirmBtn);

    expect(setHolidays).toHaveBeenCalled();
  });

  it('should close editing without updating holidays when no changes are made and saved', () => {
    const { setHolidays } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const saveBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setHolidays).toHaveBeenCalled();
    const updateFn = setHolidays.mock.calls[0][0];
    const initialHolidays = [
      aHolidayLeave({ id: 'leave_1', date: '2026-12-25', type: 'holiday', name: 'Christmas' })
    ];
    const updatedHolidays = updateFn(initialHolidays);
    expect(updatedHolidays[0]).toBe(initialHolidays[0]);
  });

  it('should trigger setHolidays with update and new history entry when type is changed and reason is entered', () => {
    const { setHolidays } = setup();
    const holidaysTableWrapper = screen.getByText(/holidays_leaves table/i).closest('.border');

    const editBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(editBtn);

    const select = holidaysTableWrapper?.querySelector('select') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'leave' } });
    const reasonInput = screen.getByLabelText(/Reason for modification/i);
    fireEvent.change(reasonInput, { target: { value: 'Custom reason text' } });

    const saveBtn = holidaysTableWrapper?.querySelector('tbody tr button:nth-last-child(2)') as HTMLElement;
    fireEvent.click(saveBtn);

    expect(setHolidays).toHaveBeenCalled();
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
    const historyBtn = holidaysTableWrapper?.querySelector('tbody tr button') as HTMLElement;
    expect(screen.queryByText(/Audit Trail/i)).toBeNull();

    fireEvent.click(historyBtn);
    expect(screen.getByText(/Audit Trail/i)).not.toBeNull();
    expect(screen.getByText(/"Initial Correction"/i)).not.toBeNull();

    fireEvent.click(historyBtn);
    expect(screen.queryByText(/Audit Trail/i)).toBeNull();
  });
});

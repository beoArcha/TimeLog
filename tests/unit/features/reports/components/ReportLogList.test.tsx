// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReportLogList from '@features/reports/components/ReportLogList';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';

describe('Unit Tests: ReportLogList', () => {
  afterEach(() => {
    cleanup();
  });
  const mockProjects = [
    { id: 'p1', name: 'Proj Alpha', color: 'indigo', createdAt: '2026-06-15' },
    { id: 'p2', name: 'Proj Beta', color: 'orange', createdAt: '2026-06-15' },
  ];

  const mockTasks = [
    { id: 't1', projectId: 'p1', name: 'Task Alpha', completed: false, createdAt: '2026-06-15' },
    { id: 't2', projectId: 'p2', name: 'Task Beta', completed: false, createdAt: '2026-06-15' },
    { id: 't3', projectId: 'p1', name: 'Task Gamma', completed: false, createdAt: '2026-06-15' },
    { id: 't4', projectId: 'p1', name: 'Task Delta', completed: false, createdAt: '2026-06-15' },
  ];

  const mockSourceLogs = [
    {
      id: 'l1',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
      note: 'Feature implementation notes',
    },
    {
      id: 'l2',
      taskId: 't2',
      projectId: 'p2',
      startTime: '2026-06-15T12:00:00Z',
      endTime: '2026-06-15T13:00:00Z',
      note: 'Client meeting discussion',
    },
    {
      id: 'l-active',
      taskId: 't3',
      projectId: 'p1',
      startTime: '2026-06-15T14:00:00Z',
      endTime: undefined,
      note: 'Running ongoing work',
    },
  ];

  const mockDisplayLogs: Array<ClampedTimeLog | typeof mockSourceLogs[0]> = [
    mockSourceLogs[0],
    mockSourceLogs[1],
    mockSourceLogs[2],
    {
      id: 'l-patch',
      taskId: 't4',
      projectId: 'p1',
      startTime: '2026-06-15T09:00:00Z',
      endTime: '2026-06-15T09:30:00Z',
      originalDurationSeconds: 1800,
      clampedDurationSeconds: 1800,
      isMultiDaySegment: false,
      clampedStartTime: '2026-06-15T09:00:00Z',
      clampedEndTime: '2026-06-15T09:30:00Z',
      note: 'Manual adjustment',
      isPatch: true,
    },
  ];

  const mockProps = {
    filteredLogs: mockSourceLogs,
    projectChart: [
      { id: 'p1', name: 'Proj Alpha', color: 'indigo', seconds: 3600, tasks: [] },
      { id: 'p2', name: 'Proj Beta', color: 'orange', seconds: 3600, tasks: [] },
    ],
    maxSec: 3600,
    displayLogs: mockDisplayLogs,
    projects: mockProjects,
    tasks: mockTasks,
    nowIso: '2026-06-15T15:00:00Z',
    logs: mockSourceLogs,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render log list items, project distribution, and search input', () => {
    render(
      <MockProviders>
        <ReportLogList {...mockProps} />
      </MockProviders>
    );

    expect(screen.getByText(/"Task Alpha"/i)).not.toBeNull();
    expect(screen.getByText(/"Task Beta"/i)).not.toBeNull();
    expect(screen.getByTestId('report-logs-search-input')).not.toBeNull();
  });

  describe('Live Text Search Filtering', () => {
    it('should filter log entries by task name', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Beta' } });

      expect(screen.queryByText(/"Task Alpha"/i)).toBeNull();
      expect(screen.getByText(/"Task Beta"/i)).not.toBeNull();
    });

    it('should filter log entries by project name', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Proj Alpha' } });

      expect(screen.getByText(/"Task Alpha"/i)).not.toBeNull();
      expect(screen.queryByText(/"Task Beta"/i)).toBeNull();
    });

    it('should filter log entries by note content', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'Client meeting' } });

      expect(screen.queryByText(/"Task Alpha"/i)).toBeNull();
      expect(screen.getByText(/"Task Beta"/i)).not.toBeNull();
    });

    it('should show empty state message when no logs match the query', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      const searchInput = screen.getByTestId('report-logs-search-input');
      fireEvent.change(searchInput, { target: { value: 'NonExistentString123' } });

      expect(screen.queryByText(/"Task Alpha"/i)).toBeNull();
      expect(screen.queryByText(/"Task Beta"/i)).toBeNull();
      expect(screen.getByText(/No time logs match/i)).not.toBeNull();
    });
  });

  describe('Safeguards for Active Timers and Patch Logs', () => {
    it('should disable edit and delete actions on active timer logs with safeguard title', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} activeTimerLogId="l-active" />
        </MockProviders>
      );

      const editBtn = screen.getByTestId('edit-log-l-active');
      const deleteBtn = screen.getByTestId('delete-log-l-active');

      expect(editBtn.getAttribute('disabled')).not.toBeNull();
      expect(deleteBtn.getAttribute('disabled')).not.toBeNull();
      expect(editBtn.getAttribute('title')).toContain('Cannot modify an active timer');
    });

    it('should not render edit or delete buttons for read-only PatchLog entries', () => {
      render(
        <MockProviders>
          <ReportLogList {...mockProps} />
        </MockProviders>
      );

      expect(screen.queryByTestId('edit-log-l-patch')).toBeNull();
      expect(screen.queryByTestId('delete-log-l-patch')).toBeNull();
      expect(screen.getByText(/Adjustment/i)).not.toBeNull();
    });
  });

  describe('Inline Edit Audit Flow', () => {
    it('should open ReportLogEditModal, require an audit reason, and delegate the edit to DataContext', async () => {
      const handleEditTimeLogMock = vi.fn().mockResolvedValue({
        saved: true,
        synchronized: true,
      });
      const onLogUpdatedMock = vi.fn();

      render(
        <MockProviders dataState={{ handleEditTimeLog: handleEditTimeLogMock }}>
          <ReportLogList {...mockProps} onLogUpdated={onLogUpdatedMock} />
        </MockProviders>
      );

      fireEvent.click(screen.getByTestId('edit-log-l1'));

      expect(screen.getByTestId('audit-edit-start-time')).not.toBeNull();
      expect(screen.getByTestId('audit-edit-reason')).not.toBeNull();

      const saveBtn = screen.getByTestId('audit-save-button');
      expect(saveBtn.getAttribute('disabled')).not.toBeNull();

      fireEvent.change(screen.getByTestId('audit-edit-reason'), {
        target: { value: 'Corrected duration for client review' },
      });
      expect(saveBtn.getAttribute('disabled')).toBeNull();

      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(handleEditTimeLogMock).toHaveBeenCalledWith(
          'l1',
          't1',
          '2026-06-15T10:00:00Z',
          '2026-06-15T11:00:00Z',
          'Feature implementation notes',
          'Corrected duration for client review'
        );
        expect(onLogUpdatedMock).toHaveBeenCalledWith('l1');
      });
    });
  });

  describe('Inline Delete Confirmation Flow', () => {
    it('should open ConfirmDialog and execute delete when confirmed', async () => {
      const handleDeleteMock = vi.fn().mockResolvedValue(undefined);
      const onLogDeletedMock = vi.fn();

      render(
        <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteMock }}>
          <ReportLogList {...mockProps} onLogDeleted={onLogDeletedMock} />
        </MockProviders>
      );

      const deleteBtn = screen.getByTestId('delete-log-l1');
      fireEvent.click(deleteBtn);

      expect(screen.getByText(/Delete Time Log\?/i)).not.toBeNull();

      const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(handleDeleteMock).toHaveBeenCalledWith('l1');
        expect(onLogDeletedMock).toHaveBeenCalledWith('l1');
      });
    });

    it('should keep ConfirmDialog open, display error alert, and not call onLogDeleted when deletion fails', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const handleDeleteMock = vi.fn().mockRejectedValue(new Error('Database lock timeout'));
      const onLogDeletedMock = vi.fn();

      render(
        <MockProviders dataState={{ handleDeleteTimeLog: handleDeleteMock }}>
          <ReportLogList {...mockProps} onLogDeleted={onLogDeletedMock} />
        </MockProviders>
      );

      const deleteBtn = screen.getByTestId('delete-log-l1');
      fireEvent.click(deleteBtn);

      expect(screen.getByText(/Delete Time Log\?/i)).not.toBeNull();

      const confirmBtn = screen.getByTestId('confirm-dialog-confirm-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(handleDeleteMock).toHaveBeenCalledWith('l1');
      });

      // ConfirmDialog must stay open and display the error
      await waitFor(() => {
        expect(screen.getByTestId('confirm-dialog-error')).not.toBeNull();
        expect(screen.getByRole('alert')).not.toBeNull();
      });

      // onLogDeleted must NOT have been called
      expect(onLogDeletedMock).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  it('should apply print:max-h-none, print:h-auto and print:overflow-visible to prevent print clipping', () => {
    render(<ReportLogList {...mockProps} />);
    const scrollContainer = screen.getByTestId('report-log-list-scroll-container');
    expect(scrollContainer).not.toBeNull();
    // Normal screen constraints
    expect(scrollContainer.className).toContain('max-h-[250px]');
    expect(scrollContainer.className).toContain('overflow-y-auto');
    // Print unclip constraints
    expect(scrollContainer.className).toContain('print:max-h-none');
    expect(scrollContainer.className).toContain('print:overflow-visible');
    expect(scrollContainer.className).toContain('print:h-auto');
  });

  it('should render dual timestamp: time-only on screen and date + time in print', () => {
    render(
      <ReportLogList
        {...mockProps}
        filteredLogs={[mockSourceLogs[0]]}
        displayLogs={[mockSourceLogs[0]]}
        locale="en"
      />
    );

    // Screen element: print:hidden
    const screenTime = screen.getByText((content, element) => {
      return (
        element?.tagName.toLowerCase() === 'span' &&
        element?.className.includes('print:hidden') &&
        content.startsWith('[') &&
        content.endsWith(']')
      );
    });
    expect(screenTime).not.toBeNull();
    expect(screenTime.className).toContain('print:hidden');

    // Print element: hidden print:inline with date and time
    const printTime = screen.getByTestId('log-entry-print-datetime');
    expect(printTime).not.toBeNull();
    expect(printTime.className).toContain('hidden');
    expect(printTime.className).toContain('print:inline');
    // In English locale, June 15 2026 is formatted as 06/15/2026
    expect(printTime.textContent).toContain('06/15/2026');
  });

  it('should localize print date timestamp when locale is Polish (pl)', () => {
    render(
      <ReportLogList
        {...mockProps}
        filteredLogs={[mockSourceLogs[0]]}
        displayLogs={[mockSourceLogs[0]]}
        locale="pl"
      />
    );

    const printTime = screen.getByTestId('log-entry-print-datetime');
    expect(printTime).not.toBeNull();
    // In Polish locale, June 15 2026 is formatted as 15.06.2026
    expect(printTime.textContent).toContain('15.06.2026');
  });

  it('should display distinct calendar dates for multi-day log entries in print output', () => {
    const multiDayLogs = [
      {
        id: 'l1',
        taskId: 't1',
        projectId: 'p1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: '2026-06-15T11:00:00Z',
        note: 'Day 1 task',
      },
      {
        id: 'l2',
        taskId: 't1',
        projectId: 'p1',
        startTime: '2026-06-16T14:00:00Z',
        endTime: '2026-06-16T15:00:00Z',
        note: 'Day 2 task',
      },
    ];

    render(
      <ReportLogList
        {...mockProps}
        locale="en"
        filteredLogs={multiDayLogs}
        displayLogs={multiDayLogs}
      />
    );

    const printTimes = screen.getAllByTestId('log-entry-print-datetime');
    expect(printTimes).toHaveLength(2);
    expect(printTimes[0].textContent).toContain('06/15/2026');
    expect(printTimes[1].textContent).toContain('06/16/2026');
  });

  it('should include pagination split contract data-slots and row break avoid classes', () => {
    const { container } = render(<ReportLogList {...mockProps} />);

    const rootList = screen.getByTestId('report-log-list');
    expect(rootList.getAttribute('data-slot')).toBe('report-log-list');
    expect(rootList.className).toContain('print:break-inside-auto');

    const dumpSection = container.querySelector('[data-slot="report-log-dump-section"]');
    expect(dumpSection).not.toBeNull();
    expect(dumpSection?.className).toContain('print:break-inside-auto');

    const rows = container.querySelectorAll('[data-slot="report-log-row"]');
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach(row => {
      expect(row.className).toContain('print:break-inside-avoid');
    });
  });

  it('should render all entries in DOM when log list exceeds container height (multi-entry report)', () => {
    const largeLogsCount = 40;
    const tasks = Array.from({ length: largeLogsCount }, (_, idx) => ({
      id: `task-${idx}`,
      projectId: 'p1',
      name: `Dedicated Task ${idx}`,
      completed: false,
      createdAt: '2026-06-15',
    }));

    const largeLogs = Array.from({ length: largeLogsCount }, (_, idx) => ({
      id: `log-${idx}`,
      taskId: `task-${idx}`,
      projectId: 'p1',
      startTime: `2026-06-15T${String(8 + Math.floor(idx / 4)).padStart(2, '0')}:${String((idx % 4) * 15).padStart(2, '0')}:00Z`,
      endTime: `2026-06-15T${String(8 + Math.floor(idx / 4)).padStart(2, '0')}:${String((idx % 4) * 15 + 10).padStart(2, '0')}:00Z`,
      note: `Log entry item ${idx}`,
    }));

    render(
      <ReportLogList
        {...mockProps}
        tasks={tasks}
        displayLogs={largeLogs}
        filteredLogs={largeLogs}
      />
    );

    const scrollContainer = screen.getByTestId('report-log-list-scroll-container');
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer.children.length).toBe(largeLogsCount);

    // Ensure all 40 elements are rendered in DOM without truncation
    for (let i = 0; i < largeLogsCount; i++) {
      expect(screen.getByText(`"Dedicated Task ${i}"`)).not.toBeNull();
    }
    // Verify print unclip classes are present for entire set
    expect(scrollContainer.className).toContain('print:max-h-none');
    expect(scrollContainer.className).toContain('print:overflow-visible');
    expect(scrollContainer.className).toContain('print:h-auto');
  });

  it('should format date and time in UTC for day boundaries and timezone offsets', () => {
    const logsWithOffsets = [
      {
        id: 'l-offset-prev-day',
        taskId: 't1',
        projectId: 'p1',
        // 2026-06-16 01:30:00 +04:00 is 2026-06-15 21:30:00 UTC
        startTime: '2026-06-16T01:30:00+04:00',
        endTime: '2026-06-16T02:00:00+04:00',
      },
      {
        id: 'l-offset-next-day',
        taskId: 't1',
        projectId: 'p1',
        // 2026-06-15 20:00:00 -05:00 is 2026-06-16 01:00:00 UTC
        startTime: '2026-06-15T20:00:00-05:00',
        endTime: '2026-06-15T21:00:00-05:00',
      },
      {
        id: 'l-midnight',
        taskId: 't1',
        projectId: 'p1',
        // 2026-06-15 00:00:00 UTC
        startTime: '2026-06-15T00:00:00Z',
        endTime: '2026-06-15T01:00:00Z',
      },
    ];

    render(
      <ReportLogList
        {...mockProps}
        locale="pl"
        filteredLogs={logsWithOffsets}
        displayLogs={logsWithOffsets}
      />
    );

    const printTimes = screen.getAllByTestId('log-entry-print-datetime');
    expect(printTimes).toHaveLength(3);

    // Entry 1: in UTC should be 15.06.2026 21:30:00
    expect(printTimes[0].textContent).toContain('15.06.2026');
    expect(printTimes[0].textContent).toContain('21:30:00');

    // Entry 2: in UTC should be 16.06.2026 01:00:00
    expect(printTimes[1].textContent).toContain('16.06.2026');
    expect(printTimes[1].textContent).toContain('01:00:00');

    // Entry 3: midnight UTC should be 15.06.2026 00:00:00
    expect(printTimes[2].textContent).toContain('15.06.2026');
    expect(printTimes[2].textContent).toContain('00:00:00');
  });

  it('should safely display [N/A] when log startTime is invalid or malformed', () => {
    const invalidLogs = [
      {
        id: 'l-invalid',
        taskId: 't1',
        projectId: 'p1',
        startTime: 'invalid-date-string',
        endTime: 'invalid-date-string',
      },
    ];

    render(
      <ReportLogList
        {...mockProps}
        filteredLogs={invalidLogs}
        displayLogs={invalidLogs}
      />
    );

    const printTime = screen.getByTestId('log-entry-print-datetime');
    expect(printTime).not.toBeNull();
    expect(printTime.textContent).toContain('[N/A]');
  });

  describe('Timezone Regression & Separation (Screen vs Print)', () => {
    it('should format screen time in CET (UTC+1) while maintaining UTC in print output', () => {
      const winterLog = [
        {
          id: 'l-winter',
          taskId: 't1',
          projectId: 'p1',
          startTime: '2026-01-15T12:00:00Z',
          endTime: '2026-01-15T13:00:00Z',
        },
      ];

      render(
        <ReportLogList
          {...mockProps}
          locale="pl"
          timeZone="CET"
          filteredLogs={winterLog}
          displayLogs={winterLog}
        />
      );

      const screenTime = screen.getByTestId('log-entry-screen-time');
      const printTime = screen.getByTestId('log-entry-print-datetime');

      // CET is UTC+1 in winter: 12:00 UTC -> 13:00 on screen
      expect(screenTime.textContent).toContain('13:00:00');

      // Print output strictly retains UTC: 12:00:00
      expect(printTime.textContent).toContain('15.01.2026');
      expect(printTime.textContent).toContain('12:00:00');
    });

    it('should format screen time in CEST (UTC+2) while maintaining UTC in print output', () => {
      const summerLog = [
        {
          id: 'l-summer',
          taskId: 't1',
          projectId: 'p1',
          startTime: '2026-06-15T12:00:00Z',
          endTime: '2026-06-15T13:00:00Z',
        },
      ];

      render(
        <ReportLogList
          {...mockProps}
          locale="pl"
          timeZone="CEST"
          filteredLogs={summerLog}
          displayLogs={summerLog}
        />
      );

      const screenTime = screen.getByTestId('log-entry-screen-time');
      const printTime = screen.getByTestId('log-entry-print-datetime');

      // CEST is UTC+2: 12:00 UTC -> 14:00 on screen
      expect(screenTime.textContent).toContain('14:00:00');

      // Print output strictly retains UTC: 12:00:00
      expect(printTime.textContent).toContain('15.06.2026');
      expect(printTime.textContent).toContain('12:00:00');
    });

    it('should render distinct times for the same timestamp on screen (local tz) and print (UTC)', () => {
      const sharedTimestampLog = [
        {
          id: 'l-shared',
          taskId: 't1',
          projectId: 'p1',
          startTime: '2026-06-15T09:15:30Z',
          endTime: '2026-06-15T10:15:30Z',
        },
      ];

      render(
        <ReportLogList
          {...mockProps}
          locale="en"
          timeZone="+02:00"
          filteredLogs={sharedTimestampLog}
          displayLogs={sharedTimestampLog}
        />
      );

      const screenTime = screen.getByTestId('log-entry-screen-time');
      const printTime = screen.getByTestId('log-entry-print-datetime');

      // In +02:00 timezone: 09:15:30 UTC -> 11:15:30 on screen
      expect(screenTime.textContent).toContain('11:15:30');

      // In print (UTC): 06/15/2026 09:15:30
      expect(printTime.textContent).toContain('06/15/2026');
      expect(printTime.textContent).toContain('09:15:30');
    });

    it('should correctly handle day boundary transitions when converting timezones between screen and print', () => {
      const boundaryLogs = [
        {
          id: 'l-next-day-screen',
          taskId: 't1',
          projectId: 'p1',
          // 23:30 UTC on June 15 is 01:30 on June 16 in CEST (UTC+2)
          startTime: '2026-06-15T23:30:00Z',
          endTime: '2026-06-16T00:30:00Z',
        },
      ];

      render(
        <ReportLogList
          {...mockProps}
          locale="pl"
          timeZone="CEST"
          filteredLogs={boundaryLogs}
          displayLogs={boundaryLogs}
        />
      );

      const screenTime = screen.getByTestId('log-entry-screen-time');
      const printTime = screen.getByTestId('log-entry-print-datetime');

      // Screen shifts past midnight to next calendar day: 01:30:00
      expect(screenTime.textContent).toContain('01:30:00');

      // Print remains anchored on UTC calendar date: 15.06.2026 23:30:00
      expect(printTime.textContent).toContain('15.06.2026');
      expect(printTime.textContent).toContain('23:30:00');
    });

    it('should correctly handle backward day transitions for negative timezone offsets', () => {
      const negativeOffsetLogs = [
        {
          id: 'l-prev-day-screen',
          taskId: 't1',
          projectId: 'p1',
          // 00:30 UTC on June 15 is 20:30 on June 14 in UTC-4 (EDT)
          startTime: '2026-06-15T00:30:00Z',
          endTime: '2026-06-15T01:30:00Z',
        },
      ];

      render(
        <ReportLogList
          {...mockProps}
          locale="pl"
          timeZone="-04:00"
          filteredLogs={negativeOffsetLogs}
          displayLogs={negativeOffsetLogs}
        />
      );

      const screenTime = screen.getByTestId('log-entry-screen-time');
      const printTime = screen.getByTestId('log-entry-print-datetime');

      // Screen shifts before midnight to previous day: 20:30:00
      expect(screenTime.textContent).toContain('20:30:00');

      // Print remains anchored on UTC calendar date: 15.06.2026 00:30:00
      expect(printTime.textContent).toContain('15.06.2026');
      expect(printTime.textContent).toContain('00:30:00');
    });

    it('should correctly format date and time across all supported locales', () => {
      const locales = ['en', 'pl', 'de', 'es', 'fr', 'pt-br', 'ja', 'nl', 'it', 'uk'] as const;
      const testLog = [
        {
          id: 'l-locale-test',
          taskId: 't1',
          projectId: 'p1',
          startTime: '2026-06-15T14:30:45Z',
          endTime: '2026-06-15T15:30:45Z',
        },
      ];

      locales.forEach((loc) => {
        const { unmount } = render(
          <ReportLogList
            {...mockProps}
            locale={loc}
            timeZone="UTC"
            filteredLogs={testLog}
            displayLogs={testLog}
          />
        );

        const screenTime = screen.getByTestId('log-entry-screen-time');
        const printTime = screen.getByTestId('log-entry-print-datetime');

        expect(screenTime.textContent).not.toBeNull();
        expect(screenTime.textContent).not.toBe('[N/A]');
        expect(printTime.textContent).not.toBeNull();
        expect(printTime.textContent).not.toBe('[N/A]');

        unmount();
      });
    });
  });
});


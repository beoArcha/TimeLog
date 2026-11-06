// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import ReportLogList from '@features/reports/components/ReportLogList';

describe('Unit Tests: ReportLogList', () => {
  afterEach(() => {
    cleanup();
  });
  const mockProps = {
    filteredLogs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'Completed Task note' }
    ],
    projectChart: [
      { id: 'p1', name: 'Proj A', color: 'indigo', seconds: 3600, tasks: [] }
    ],
    maxSec: 3600,
    displayLogs: [
      { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: '2026-06-15T13:00:00Z', note: 'Completed Task note' }
    ],
    projects: [
      { id: 'p1', name: 'Proj A', color: 'indigo', createdAt: '2026-06-15' }
    ],
    tasks: [
      { id: 't1', projectId: 'p1', name: 'Task One', completed: false, createdAt: '2026-06-15' }
    ],
    nowIso: '2026-06-15T14:00:00Z',
    theme: 'dark',
    locale: 'en' as const,
    customTranslations: {},
    th: {}
  };

  it('should render log list items', () => {
    render(<ReportLogList {...mockProps} />);
    expect(screen.getByText(/Task One/i)).not.toBeNull();
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
    render(<ReportLogList {...mockProps} locale="en" />);

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
    render(<ReportLogList {...mockProps} locale="pl" />);

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
});

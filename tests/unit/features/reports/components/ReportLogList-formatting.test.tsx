// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import ReportLogList from '@features/reports/components/ReportLogList';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';

describe('Unit Tests: ReportLogList Formatting and Timezones', () => {
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
  ];

  const mockProps = {
    filteredLogs: [],
    projectChart: [
      { id: 'p1', name: 'Proj Alpha', color: 'indigo', seconds: 3600, tasks: [] },
    ],
    maxSec: 3600,
    displayLogs: [],
    projects: mockProjects,
    tasks: mockTasks,
    nowIso: '2026-06-15T15:00:00Z',
    logs: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should include pagination split contract data-slots and row break avoid classes', () => {
    // Arrange
    const sampleLog: ClampedTimeLog = {
      id: 'l1',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
      originalDurationSeconds: 3600,
      clampedDurationSeconds: 3600,
      isMultiDaySegment: false,
      clampedStartTime: '2026-06-15T10:00:00Z',
      clampedEndTime: '2026-06-15T11:00:00Z',
    };

    // Act
    const { container } = render(
      <ReportLogList
        {...mockProps}
        filteredLogs={[sampleLog]}
        displayLogs={[sampleLog]}
      />
    );

    // Assert
    const rootList = screen.getByTestId('report-log-list');
    expect(rootList.getAttribute('data-slot')).toBe('report-log-list');
    expect(rootList.className).toContain('print:break-inside-auto');

    const dumpSection = container.querySelector('[data-slot="report-log-dump-section"]');
    expect(dumpSection).not.toBeNull();
    expect(dumpSection?.className).toContain('print:break-inside-auto');

    const rows = container.querySelectorAll('[data-slot="report-log-row"]');
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((row) => {
      expect(row.className).toContain('print:break-inside-avoid');
    });
  });

  it('should render all entries in DOM when log list exceeds container height (multi-entry report)', () => {
    // Arrange
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

    // Act
    const { container } = render(
      <ReportLogList
        {...mockProps}
        tasks={tasks}
        displayLogs={largeLogs}
        filteredLogs={largeLogs}
      />
    );

    // Assert
    const scrollContainer = screen.getByTestId('report-log-list-scroll-container');
    expect(scrollContainer).not.toBeNull();
    expect(container.querySelectorAll('[data-slot="report-log-row"]')).toHaveLength(largeLogsCount);
    expect(scrollContainer.querySelectorAll('[data-slot="report-project-section"]')).toHaveLength(1);

    for (let i = 0; i < largeLogsCount; i++) {
      expect(screen.getByText(`"Dedicated Task ${i}"`)).not.toBeNull();
    }
    expect(scrollContainer.className).toContain('print:max-h-none');
    expect(scrollContainer.className).toContain('print:overflow-visible');
    expect(scrollContainer.className).toContain('print:h-auto');
  });

  it('should format date and time in UTC for day boundaries and timezone offsets', () => {
    // Arrange
    const logsWithOffsets = [
      {
        id: 'l-offset-prev-day',
        taskId: 't1',
        projectId: 'p1',
        startTime: '2026-06-16T01:30:00+04:00',
        endTime: '2026-06-16T02:00:00+04:00',
      },
      {
        id: 'l-offset-next-day',
        taskId: 't1',
        projectId: 'p1',
        startTime: '2026-06-15T20:00:00-05:00',
        endTime: '2026-06-15T21:00:00-05:00',
      },
      {
        id: 'l-midnight',
        taskId: 't1',
        projectId: 'p1',
        startTime: '2026-06-15T00:00:00Z',
        endTime: '2026-06-15T01:00:00Z',
      },
    ];

    // Act
    render(
      <ReportLogList
        {...mockProps}
        locale="pl"
        filteredLogs={logsWithOffsets}
        displayLogs={logsWithOffsets}
      />
    );

    // Assert
    const printTimes = screen.getAllByTestId('log-entry-print-datetime');
    expect(printTimes).toHaveLength(3);

    expect(printTimes[0].textContent).toContain('15.06.2026');
    expect(printTimes[0].textContent).toContain('21:30:00');

    expect(printTimes[1].textContent).toContain('16.06.2026');
    expect(printTimes[1].textContent).toContain('01:00:00');

    expect(printTimes[2].textContent).toContain('15.06.2026');
    expect(printTimes[2].textContent).toContain('00:00:00');
  });

  it('should safely display [N/A] when log startTime is invalid or malformed', () => {
    // Arrange
    const invalidLogs = [
      {
        id: 'l-invalid',
        taskId: 't1',
        projectId: 'p1',
        startTime: 'invalid-date-string',
        endTime: 'invalid-date-string',
      },
    ];

    // Act
    render(
      <ReportLogList
        {...mockProps}
        filteredLogs={invalidLogs}
        displayLogs={invalidLogs}
      />
    );

    // Assert
    const printTime = screen.getByTestId('log-entry-print-datetime');
    expect(printTime).not.toBeNull();
    expect(printTime.textContent).toContain('[N/A]');
  });

  describe('Timezone Separation: Screen vs Print', () => {
    it('should format screen time in CET while maintaining UTC in print output', () => {
      // Arrange
      const winterLog = [
        {
          id: 'l-winter',
          taskId: 't1',
          projectId: 'p1',
          startTime: '2026-01-15T12:00:00Z',
          endTime: '2026-01-15T13:00:00Z',
        },
      ];

      // Act
      render(
        <ReportLogList
          {...mockProps}
          locale="pl"
          timeZone="CET"
          filteredLogs={winterLog}
          displayLogs={winterLog}
        />
      );

      // Assert
      const screenTime = screen.getByTestId('log-entry-screen-time');
      const printTime = screen.getByTestId('log-entry-print-datetime');

      expect(screenTime.textContent).toContain('13:00:00');
      expect(printTime.textContent).toContain('15.01.2026');
      expect(printTime.textContent).toContain('12:00:00');
    });

    it('should format screen time in CEST while maintaining UTC in print output', () => {
      // Arrange
      const summerLog = [
        {
          id: 'l-summer',
          taskId: 't1',
          projectId: 'p1',
          startTime: '2026-06-15T12:00:00Z',
          endTime: '2026-06-15T13:00:00Z',
        },
      ];

      // Act
      render(
        <ReportLogList
          {...mockProps}
          locale="pl"
          timeZone="CEST"
          filteredLogs={summerLog}
          displayLogs={summerLog}
        />
      );

      // Assert
      const screenTime = screen.getByTestId('log-entry-screen-time');
      const printTime = screen.getByTestId('log-entry-print-datetime');

      expect(screenTime.textContent).toContain('14:00:00');
      expect(printTime.textContent).toContain('15.06.2026');
      expect(printTime.textContent).toContain('12:00:00');
    });

    it('should correctly handle day boundary transitions when converting timezones between screen and print', () => {
      // Arrange
      const boundaryLogs = [
        {
          id: 'l-next-day-screen',
          taskId: 't1',
          projectId: 'p1',
          startTime: '2026-06-15T23:30:00Z',
          endTime: '2026-06-16T00:30:00Z',
        },
      ];

      // Act
      render(
        <ReportLogList
          {...mockProps}
          locale="pl"
          timeZone="CEST"
          filteredLogs={boundaryLogs}
          displayLogs={boundaryLogs}
        />
      );

      // Assert
      const screenTime = screen.getByTestId('log-entry-screen-time');
      const printTime = screen.getByTestId('log-entry-print-datetime');

      expect(screenTime.textContent).toContain('01:30:00');
      expect(printTime.textContent).toContain('15.06.2026');
      expect(printTime.textContent).toContain('23:30:00');
    });

    it('should correctly handle backward day transitions for negative timezone offsets', () => {
      // Arrange
      const negativeOffsetLogs = [
        {
          id: 'l-prev-day-screen',
          taskId: 't1',
          projectId: 'p1',
          startTime: '2026-06-15T00:30:00Z',
          endTime: '2026-06-15T01:30:00Z',
        },
      ];

      // Act
      render(
        <ReportLogList
          {...mockProps}
          locale="pl"
          timeZone="-04:00"
          filteredLogs={negativeOffsetLogs}
          displayLogs={negativeOffsetLogs}
        />
      );

      // Assert
      const screenTime = screen.getByTestId('log-entry-screen-time');
      const printTime = screen.getByTestId('log-entry-print-datetime');

      expect(screenTime.textContent).toContain('20:30:00');
      expect(printTime.textContent).toContain('15.06.2026');
      expect(printTime.textContent).toContain('00:30:00');
    });

    it('should correctly format date and time across all supported locales', () => {
      // Arrange
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

      // Act & Assert
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

import { describe, it, expect } from 'vitest';
import { calculateReportStatistics } from '@features/reports/utils/reportCalculator';
import { TimeLog } from '@bindings/TimeLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Unit: reportCalculator - Period Ranges and Multi-Day Clamping', () => {
  const projects: Project[] = [
    aProject({ id: 'p1', name: 'Alpha Project', color: 'blue', createdAt: '2026-07-01T00:00:00Z' }),
    aProject({ id: 'p2', name: 'Beta Project', color: 'green', createdAt: '2026-07-01T00:00:00Z' }),
  ];

  const tasks: Task[] = [
    aTask({ id: 't1', projectId: 'p1', name: 'Task 1', createdAt: '2026-07-01T00:00:00Z' }),
    aTask({ id: 't2', projectId: 'p2', name: 'Task 2', createdAt: '2026-07-01T00:00:00Z' }),
  ];

  it('should filter logs by week period when reportPeriod is "week"', () => {
    // Arrange
    const nowIso = '2026-07-15T12:00:00.000Z'; // Wednesday of week starting 2026-07-13
    const logs: TimeLog[] = [
      aTimeLog({
        id: 'log-this-week',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-14T10:00:00.000Z',
        endTime: '2026-07-14T11:00:00.000Z',
      }),
      aTimeLog({
        id: 'log-prev-week',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-10T10:00:00.000Z',
        endTime: '2026-07-10T11:00:00.000Z',
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso,
      reportPeriod: 'week',
      reportSort: 'duration',
    });

    // Assert
    expect(result.filteredLogs).toHaveLength(1);
    expect(result.filteredLogs[0].id).toBe('log-this-week');
  });

  it('should filter logs by month period when reportPeriod is "month"', () => {
    // Arrange
    const nowIso = '2026-07-15T12:00:00.000Z';
    const logs: TimeLog[] = [
      aTimeLog({
        id: 'log-this-month',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-02T10:00:00.000Z',
        endTime: '2026-07-02T11:00:00.000Z',
      }),
      aTimeLog({
        id: 'log-prev-month',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-28T10:00:00.000Z',
        endTime: '2026-06-28T11:00:00.000Z',
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso,
      reportPeriod: 'month',
      reportSort: 'duration',
    });

    // Assert
    expect(result.filteredLogs).toHaveLength(1);
    expect(result.filteredLogs[0].id).toBe('log-this-month');
  });

  it('should include all logs when reportPeriod is "all"', () => {
    // Arrange
    const nowIso = '2026-07-15T12:00:00.000Z';
    const logs: TimeLog[] = [
      aTimeLog({
        id: 'log-1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2025-01-01T10:00:00.000Z',
        endTime: '2025-01-01T11:00:00.000Z',
      }),
      aTimeLog({
        id: 'log-2',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-15T10:00:00.000Z',
        endTime: '2026-07-15T11:00:00.000Z',
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso,
      reportPeriod: 'all',
      reportSort: 'duration',
    });

    // Assert
    expect(result.filteredLogs).toHaveLength(2);
  });

  it('should accurately clamp multi-day overnight logs to the active today window', () => {
    // Arrange: starts 2026-07-14 at 22:00, ends 2026-07-15 at 02:00 (4 hours = 14400s)
    const logs: TimeLog[] = [
      aTimeLog({
        id: 'log-overnight',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-14T22:00:00.000Z',
        endTime: '2026-07-15T02:00:00.000Z',
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso: '2026-07-15T12:00:00.000Z',
      reportPeriod: 'today',
      reportSort: 'duration',
    });

    // Assert: Only 00:00 to 02:00 belongs to today (2 hours = 7200s)
    expect(result.todaySec).toBe(7200);
    expect(result.periodTotalSec).toBe(7200);
    expect(result.clampedLogs).toHaveLength(1);
    expect(result.clampedLogs[0].clampedDurationSeconds).toBe(7200);
    expect(result.clampedLogs[0].originalDurationSeconds).toBe(14400);
    expect(result.clampedLogs[0].isMultiDaySegment).toBe(true);
  });
});

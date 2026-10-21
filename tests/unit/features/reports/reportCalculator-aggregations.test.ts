import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateReportStatistics } from '@features/reports/utils/reportCalculator';
import { TimeLog } from '@bindings/TimeLog';
import { PatchLog } from '@bindings/PatchLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { aProject, aTask, aTimeLog, aPatchLog } from '@tests/shared/builders/entity-builders';

describe('Unit: reportCalculator - Statistics, Sorting and Aggregations', () => {
  const projects: Project[] = [
    aProject({ id: 'p1', name: 'Alpha Project', color: 'blue', createdAt: '2026-07-01T00:00:00Z' }),
    aProject({ id: 'p2', name: 'Beta Project', color: 'green', createdAt: '2026-07-01T00:00:00Z' }),
  ];

  const tasks: Task[] = [
    aTask({ id: 't1', projectId: 'p1', name: 'Task 1', createdAt: '2026-07-01T00:00:00Z' }),
    aTask({ id: 't2', projectId: 'p2', name: 'Task 2', createdAt: '2026-07-01T00:00:00Z' }),
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should calculate valid numbers without NaN when nowIso is omitted for active logs', () => {
    // Arrange
    const mockedCurrentTime = new Date('2026-07-15T12:00:00.000Z');
    vi.setSystemTime(mockedCurrentTime);

    const activeLogs: TimeLog[] = [
      aTimeLog({
        id: 'log-active',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-15T11:00:00.000Z',
        endTime: undefined,
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs: activeLogs,
      patches: [],
      projects,
      tasks,
      reportPeriod: 'today',
      reportSort: 'duration',
    });

    // Assert
    expect(Number.isNaN(result.todaySec)).toBe(false);
    expect(Number.isNaN(result.weekSec)).toBe(false);
    expect(Number.isNaN(result.monthSec)).toBe(false);
    expect(result.todaySec).toBe(3600);

    const alphaProject = result.projectChart.find(p => p.id === 'p1');
    expect(alphaProject).toBeDefined();
    expect(Number.isNaN(alphaProject?.seconds)).toBe(false);
    expect(alphaProject?.seconds).toBe(3600);
    expect(alphaProject?.tasks[0]?.seconds).toBe(3600);
    expect(result.maxSec).toBe(3600);
    expect(result.displayLogs).toHaveLength(1);
  });

  it('should compute deterministic durations when nowIso is explicitly provided for active logs', () => {
    // Arrange
    const fixedNowIso = '2026-07-15T12:30:00.000Z';
    const activeLogs: TimeLog[] = [
      aTimeLog({
        id: 'log-active-fixed',
        projectId: 'p2',
        taskId: 't2',
        startTime: '2026-07-15T12:00:00.000Z',
        endTime: undefined,
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs: activeLogs,
      patches: [],
      projects,
      tasks,
      nowIso: fixedNowIso,
      reportPeriod: 'today',
      reportSort: 'duration',
    });

    // Assert
    expect(result.todaySec).toBe(1800);
    const betaProject = result.projectChart.find(p => p.id === 'p2');
    expect(betaProject?.seconds).toBe(1800);
  });

  it('should sort displayLogs ascending by date when reportSort is "date"', () => {
    // Arrange
    const nowIso = '2026-07-15T12:00:00.000Z';
    const logs: TimeLog[] = [
      aTimeLog({
        id: 'log-later',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-15T10:00:00.000Z',
        endTime: '2026-07-15T10:10:00.000Z',
      }),
      aTimeLog({
        id: 'log-earlier',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-15T08:00:00.000Z',
        endTime: '2026-07-15T09:00:00.000Z',
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso,
      reportPeriod: 'today',
      reportSort: 'date',
    });

    // Assert
    expect(result.displayLogs[0].id).toBe('log-earlier');
    expect(result.displayLogs[1].id).toBe('log-later');
  });

  it('should sort projectChart alphabetically by name when reportSort is not "duration"', () => {
    // Arrange
    const nowIso = '2026-07-15T12:00:00.000Z';
    const logs: TimeLog[] = [
      aTimeLog({
        id: 'log-alpha',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-15T10:00:00.000Z',
        endTime: '2026-07-15T10:01:40.000Z',
      }),
      aTimeLog({
        id: 'log-beta',
        projectId: 'p2',
        taskId: 't2',
        startTime: '2026-07-15T11:00:00.000Z',
        endTime: '2026-07-15T11:08:20.000Z',
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso,
      reportPeriod: 'today',
      reportSort: 'name',
    });

    // Assert
    expect(result.projectChart[0].name).toBe('Alpha Project');
    expect(result.projectChart[1].name).toBe('Beta Project');
  });

  it('should fallback gracefully for unknown project and filter orphan task breakdown', () => {
    // Arrange
    const nowIso = '2026-07-15T12:00:00.000Z';
    const logs: TimeLog[] = [
      aTimeLog({
        id: 'log-unknown-proj',
        projectId: 'unknown_proj_99',
        taskId: 'unknown_task_88',
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
      reportPeriod: 'today',
      reportSort: 'duration',
    });

    // Assert
    const unknownProject = result.projectChart.find(p => p.id === 'unknown_proj_99');
    expect(unknownProject).toBeDefined();
    expect(unknownProject?.name).toBe('Project unknown_proj_99');
    expect(unknownProject?.color).toBe('violet');
    expect(unknownProject?.tasks).toHaveLength(0);
  });

  it('should include patch logs in project time aggregation when sysSettings.includePatchesInReports is true', () => {
    // Arrange
    const fixedNowIso = '2026-07-15T12:00:00.000Z';
    const logs: TimeLog[] = [
      aTimeLog({
        id: 'l1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-15T10:00:00.000Z',
        endTime: '2026-07-15T11:00:00.000Z',
      }),
    ];

    const patches: PatchLog[] = [
      aPatchLog({
        id: 'patch-1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-15T08:00:00.000Z',
        endTime: '2026-07-15T08:30:00.000Z',
        patchNote: 'Note1',
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches,
      projects,
      tasks,
      nowIso: fixedNowIso,
      reportPeriod: 'today',
      reportSort: 'duration',
      sysSettings: {
        includePatchesInReports: true,
        autoStart: false,
        activeSinks: [],
      },
    });

    // Assert
    expect(result.todaySec).toBe(5400);
    const alphaProject = result.projectChart.find(p => p.id === 'p1');
    expect(alphaProject?.seconds).toBe(5400);
  });

  it('should compute periodTotalSec, dailyAverageSec, and topProject for custom range', () => {
    // Arrange
    const logs: TimeLog[] = [
      aTimeLog({
        id: 'log-1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-01T10:00:00.000Z',
        endTime: '2026-07-01T12:00:00.000Z',
      }),
      aTimeLog({
        id: 'log-2',
        projectId: 'p2',
        taskId: 't2',
        startTime: '2026-07-02T10:00:00.000Z',
        endTime: '2026-07-02T11:00:00.000Z',
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso: '2026-07-05T12:00:00.000Z',
      reportPeriod: 'custom',
      customFrom: '2026-07-01',
      customTo: '2026-07-03',
      reportSort: 'duration',
    });

    // Assert
    expect(result.periodTotalSec).toBe(10800);
    expect(result.dailyAverageSec).toBe(3600);
    expect(result.topProject).not.toBeNull();
    expect(result.topProject?.id).toBe('p1');
    expect(result.topProject?.name).toBe('Alpha Project');
    expect(result.topProject?.seconds).toBe(7200);
    expect(Math.round(result.topProject?.percentage || 0)).toBe(67);
  });
});

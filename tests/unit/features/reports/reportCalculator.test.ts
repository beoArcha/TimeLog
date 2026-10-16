import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  calculateReportStatistics,
  calculateStartOfWeek,
  calculateLogDurationSeconds,
} from '@features/reports/utils/reportCalculator';
import { TimeLog } from '@bindings/TimeLog';
import { PatchLog } from '@bindings/PatchLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { aProject, aTask, aTimeLog, aPatchLog } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: reportCalculator', () => {
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

  describe('calculateLogDurationSeconds', () => {
    const referenceNowMs = new Date('2026-07-15T12:00:00.000Z').getTime();

    it('should calculate accurate duration for normal positive time range', () => {
      const startTime = '2026-07-15T10:00:00.000Z';
      const endTime = '2026-07-15T11:00:00.000Z';
      const duration = calculateLogDurationSeconds(startTime, endTime, referenceNowMs);
      expect(duration).toBe(3600);
    });

    it('should return 0 when start time equals end time', () => {
      const startTime = '2026-07-15T10:00:00.000Z';
      const duration = calculateLogDurationSeconds(startTime, startTime, referenceNowMs);
      expect(duration).toBe(0);
    });

    it('should clamp to 0 when end time is before start time (negative duration)', () => {
      const startTime = '2026-07-15T11:00:00.000Z';
      const endTime = '2026-07-15T10:00:00.000Z';
      const duration = calculateLogDurationSeconds(startTime, endTime, referenceNowMs);
      expect(duration).toBe(0);
    });

    it('should fallback to referenceNowMs when endTime is null', () => {
      const startTime = '2026-07-15T11:00:00.000Z';
      const duration = calculateLogDurationSeconds(startTime, null, referenceNowMs);
      expect(duration).toBe(3600);
    });

    it('should fallback to referenceNowMs when endTime is undefined', () => {
      const startTime = '2026-07-15T11:30:00.000Z';
      const duration = calculateLogDurationSeconds(startTime, undefined, referenceNowMs);
      expect(duration).toBe(1800);
    });

    it('should floor fractional seconds correctly', () => {
      const startTime = '2026-07-15T10:00:00.000Z';
      const endTime = '2026-07-15T10:00:01.999Z'; // 1999 ms = 1.999s -> floor to 1s
      const duration = calculateLogDurationSeconds(startTime, endTime, referenceNowMs);
      expect(duration).toBe(1);
    });
  });

  describe('calculateStartOfWeek', () => {
    it('should calculate Monday 00:00:00 when input date is already Monday', () => {
      const monday = new Date('2026-07-13T10:15:30Z');
      const startOfWeekMs = calculateStartOfWeek(monday);
      const startOfWeek = new Date(startOfWeekMs);

      expect(startOfWeek.getDay()).toBe(1);
      expect(startOfWeek.getDate()).toBe(13);
      expect(startOfWeek.getHours()).toBe(0);
      expect(startOfWeek.getMinutes()).toBe(0);
      expect(startOfWeek.getSeconds()).toBe(0);
    });

    it('should calculate Monday 00:00:00 for mid-week Wednesday date', () => {
      const wednesday = new Date('2026-07-15T14:30:00Z');
      const startOfWeekMs = calculateStartOfWeek(wednesday);
      const startOfWeek = new Date(startOfWeekMs);

      expect(startOfWeek.getDay()).toBe(1);
      expect(startOfWeek.getDate()).toBe(13);
      expect(startOfWeek.getHours()).toBe(0);
      expect(startOfWeek.getMinutes()).toBe(0);
      expect(startOfWeek.getSeconds()).toBe(0);
    });

    it('should calculate Monday for Sunday date across week boundary', () => {
      const sunday = new Date('2026-07-19T18:00:00Z');
      const startOfWeekMs = calculateStartOfWeek(sunday);
      const startOfWeek = new Date(startOfWeekMs);

      expect(startOfWeek.getDay()).toBe(1);
      expect(startOfWeek.getDate()).toBe(13);
    });
  });

  describe('calculateReportStatistics - Periods, Sorting and Boundaries', () => {
    it('should calculate valid numbers without NaN when nowIso is omitted for active logs', () => {
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

      const result = calculateReportStatistics({
        logs: activeLogs,
        patches: [],
        projects,
        tasks,
        reportPeriod: 'today',
        reportSort: 'duration',
      });

      expect(Number.isNaN(result.todaySec)).toBe(false);
      expect(Number.isNaN(result.weekSec)).toBe(false);
      expect(Number.isNaN(result.monthSec)).toBe(false);
      expect(result.todaySec).toBe(3600);

      const alphaProject = result.projectChart.find(p => p.id === 'p1');
      expect(alphaProject).toBeDefined();
      expect(Number.isNaN(alphaProject?.seconds)).toBe(false);
      expect(alphaProject?.seconds).toBe(3600);
      expect(alphaProject?.tasks[0]?.seconds).toBe(3600);

      expect(Number.isNaN(result.maxSec)).toBe(false);
      expect(result.maxSec).toBe(3600);
      expect(result.displayLogs).toHaveLength(1);
    });

    it('should compute deterministic durations when nowIso is explicitly provided for active logs', () => {
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

      const result = calculateReportStatistics({
        logs: activeLogs,
        patches: [],
        projects,
        tasks,
        nowIso: fixedNowIso,
        reportPeriod: 'today',
        reportSort: 'duration',
      });

      expect(result.todaySec).toBe(1800);
      const betaProject = result.projectChart.find(p => p.id === 'p2');
      expect(betaProject?.seconds).toBe(1800);
    });

    it('should filter logs by week period when reportPeriod is "week"', () => {
      const nowIso = '2026-07-15T12:00:00.000Z'; // Wednesday of week starting 2026-07-13
      const logs: TimeLog[] = [
        aTimeLog({
          id: 'log-this-week',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-07-14T10:00:00.000Z', // Tuesday (within week)
          endTime: '2026-07-14T11:00:00.000Z',
        }),
        aTimeLog({
          id: 'log-prev-week',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-07-10T10:00:00.000Z', // Previous week Friday
          endTime: '2026-07-10T11:00:00.000Z',
        }),
      ];

      const result = calculateReportStatistics({
        logs,
        patches: [],
        projects,
        tasks,
        nowIso,
        reportPeriod: 'week',
        reportSort: 'duration',
      });

      expect(result.filteredLogs).toHaveLength(1);
      expect(result.filteredLogs[0].id).toBe('log-this-week');
    });

    it('should filter logs by month period when reportPeriod is "month"', () => {
      const nowIso = '2026-07-15T12:00:00.000Z';
      const logs: TimeLog[] = [
        aTimeLog({
          id: 'log-this-month',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-07-02T10:00:00.000Z', // July
          endTime: '2026-07-02T11:00:00.000Z',
        }),
        aTimeLog({
          id: 'log-prev-month',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-06-28T10:00:00.000Z', // June
          endTime: '2026-06-28T11:00:00.000Z',
        }),
      ];

      const result = calculateReportStatistics({
        logs,
        patches: [],
        projects,
        tasks,
        nowIso,
        reportPeriod: 'month',
        reportSort: 'duration',
      });

      expect(result.filteredLogs).toHaveLength(1);
      expect(result.filteredLogs[0].id).toBe('log-this-month');
    });

    it('should include all logs when reportPeriod is "all"', () => {
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

      const result = calculateReportStatistics({
        logs,
        patches: [],
        projects,
        tasks,
        nowIso,
        reportPeriod: 'all',
        reportSort: 'duration',
      });

      expect(result.filteredLogs).toHaveLength(2);
    });

    it('should sort displayLogs ascending by date when reportSort is "date"', () => {
      const nowIso = '2026-07-15T12:00:00.000Z';
      const logs: TimeLog[] = [
        aTimeLog({
          id: 'log-later',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-07-15T10:00:00.000Z',
          endTime: '2026-07-15T10:10:00.000Z', // 600s
        }),
        aTimeLog({
          id: 'log-earlier',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-07-15T08:00:00.000Z',
          endTime: '2026-07-15T09:00:00.000Z', // 3600s
        }),
      ];

      const result = calculateReportStatistics({
        logs,
        patches: [],
        projects,
        tasks,
        nowIso,
        reportPeriod: 'today',
        reportSort: 'date',
      });

      expect(result.displayLogs[0].id).toBe('log-earlier');
      expect(result.displayLogs[1].id).toBe('log-later');
    });

    it('should sort projectChart alphabetically by name when reportSort is not "duration"', () => {
      const nowIso = '2026-07-15T12:00:00.000Z';
      const logs: TimeLog[] = [
        aTimeLog({
          id: 'log-alpha',
          projectId: 'p1', // Alpha Project, duration 100s
          taskId: 't1',
          startTime: '2026-07-15T10:00:00.000Z',
          endTime: '2026-07-15T10:01:40.000Z',
        }),
        aTimeLog({
          id: 'log-beta',
          projectId: 'p2', // Beta Project, duration 500s
          taskId: 't2',
          startTime: '2026-07-15T11:00:00.000Z',
          endTime: '2026-07-15T11:08:20.000Z',
        }),
      ];

      const result = calculateReportStatistics({
        logs,
        patches: [],
        projects,
        tasks,
        nowIso,
        reportPeriod: 'today',
        reportSort: 'name',
      });

      expect(result.projectChart[0].name).toBe('Alpha Project');
      expect(result.projectChart[1].name).toBe('Beta Project');
    });

    it('should fallback gracefully for unknown project and filter orphan task breakdown', () => {
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

      const result = calculateReportStatistics({
        logs,
        patches: [],
        projects,
        tasks,
        nowIso,
        reportPeriod: 'today',
        reportSort: 'duration',
      });

      const unknownProject = result.projectChart.find(p => p.id === 'unknown_proj_99');
      expect(unknownProject).toBeDefined();
      expect(unknownProject?.name).toBe('Project unknown_proj_99');
      expect(unknownProject?.color).toBe('violet');
      // Orphan task not in tasks array is filtered out
      expect(unknownProject?.tasks).toHaveLength(0);
    });

    it('should include patch logs in project time aggregation when sysSettings.includePatchesInReports is true', () => {
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
          autoPauseOnSleep: false,
          activeSinks: [],
        },
      });

      expect(result.todaySec).toBe(5400);
      const alphaProject = result.projectChart.find(p => p.id === 'p1');
      expect(alphaProject?.seconds).toBe(5400);
    });
  });
});

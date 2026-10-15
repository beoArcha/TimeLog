import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateReportStatistics, calculateStartOfWeek } from '@features/reports/utils/reportCalculator';
import { TimeLog } from '@bindings/TimeLog';
import { PatchLog } from '@bindings/PatchLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';

describe('Unit Tests: reportCalculator', () => {
  const projects: Project[] = [
    { id: 'p1', name: 'Alpha Project', color: 'blue', createdAt: '2026-07-01T00:00:00Z' },
    { id: 'p2', name: 'Beta Project', color: 'green', createdAt: '2026-07-01T00:00:00Z' },
  ];

  const tasks: Task[] = [
    { id: 't1', projectId: 'p1', parentTaskId: null, name: 'Task 1', createdAt: '2026-07-01T00:00:00Z', completed: false },
    { id: 't2', projectId: 'p2', parentTaskId: null, name: 'Task 2', createdAt: '2026-07-01T00:00:00Z', completed: false },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('calculateStartOfWeek', () => {
    it('should calculate Monday 00:00:00 for mid-week date', () => {
      const wednesday = new Date('2026-07-15T14:30:00Z');
      const startOfWeekMs = calculateStartOfWeek(wednesday);
      const startOfWeek = new Date(startOfWeekMs);

      expect(startOfWeek.getDay()).toBe(1);
      expect(startOfWeek.getHours()).toBe(0);
      expect(startOfWeek.getMinutes()).toBe(0);
      expect(startOfWeek.getSeconds()).toBe(0);
    });

    it('should calculate Monday for Sunday date', () => {
      const sunday = new Date('2026-07-19T18:00:00Z');
      const startOfWeekMs = calculateStartOfWeek(sunday);
      const startOfWeek = new Date(startOfWeekMs);

      expect(startOfWeek.getDay()).toBe(1);
      expect(startOfWeek.getDate()).toBe(13);
    });
  });

  describe('calculateReportStatistics - Active Logs & nowIso handling', () => {
    it('should calculate valid numbers without NaN when nowIso is omitted for active logs', () => {
      const mockedCurrentTime = new Date('2026-07-15T12:00:00.000Z');
      vi.setSystemTime(mockedCurrentTime);

      const activeLogs: TimeLog[] = [
        {
          id: 'log-active',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-07-15T11:00:00.000Z', // 3600 seconds elapsed up to mockedCurrentTime
          endTime: undefined,
        },
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
        {
          id: 'log-active-fixed',
          projectId: 'p2',
          taskId: 't2',
          startTime: '2026-07-15T12:00:00.000Z', // 1800 seconds elapsed up to fixedNowIso
          endTime: undefined,
        },
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

    it('should sort displayLogs correctly by duration when active logs are present without nowIso', () => {
      const mockedCurrentTime = new Date('2026-07-15T12:00:00.000Z');
      vi.setSystemTime(mockedCurrentTime);

      const mixedLogs: TimeLog[] = [
        {
          id: 'log-short-completed',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-07-15T09:00:00.000Z',
          endTime: '2026-07-15T09:30:00.000Z', // 1800s
        },
        {
          id: 'log-active-longer',
          projectId: 'p2',
          taskId: 't2',
          startTime: '2026-07-15T10:00:00.000Z', // active for 7200s
          endTime: undefined,
        },
      ];

      const result = calculateReportStatistics({
        logs: mixedLogs,
        patches: [],
        projects,
        tasks,
        reportPeriod: 'today',
        reportSort: 'duration',
      });

      expect(result.displayLogs).toHaveLength(2);
      expect(result.displayLogs[0].id).toBe('log-active-longer');
      expect(result.displayLogs[1].id).toBe('log-short-completed');
    });

    it('should include patch logs in project time aggregation when sysSettings.includePatchesInReports is true', () => {
      const fixedNowIso = '2026-07-15T12:00:00.000Z';
      const logs: TimeLog[] = [
        {
          id: 'l1',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-07-15T10:00:00.000Z',
          endTime: '2026-07-15T11:00:00.000Z', // 3600s
        },
      ];

      const patches: PatchLog[] = [
        {
          id: 'patch-1',
          projectId: 'p1',
          taskId: 't1',
          startTime: '2026-07-15T08:00:00.000Z',
          endTime: '2026-07-15T08:30:00.000Z', // 1800s
          patchNote: 'Note1',
        },
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

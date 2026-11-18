import { describe, it, expect } from 'vitest';
import { calculateReportStatistics } from '@features/reports/utils/reportCalculator';
import { aPatchLog, aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

const WARSAW = 'Europe/Warsaw';
// Wednesday 14:00 local time (CEST, UTC+2).
const NOW_ISO = '2026-07-15T12:00:00Z';

const projects = [
  aProject({ id: 'p1', name: 'Alpha Project' }),
  aProject({ id: 'p2', name: 'Beta Project' }),
];
const tasks = [
  aTask({ id: 't1', projectId: 'p1', name: 'Task 1' }),
  aTask({ id: 't2', projectId: 'p2', name: 'Task 2' }),
];

function anHourLogOn(id: string, day: string, taskId = 't1', projectId = 'p1') {
  return aTimeLog({
    id,
    taskId,
    projectId,
    startTime: `${day}T08:00:00Z`,
    endTime: `${day}T09:00:00Z`,
  });
}

function aLogAfterLocalMidnight() {
  return aTimeLog({
    id: 'l-after-midnight',
    taskId: 't1',
    projectId: 'p1',
    startTime: '2026-07-14T22:10:00Z',
    endTime: '2026-07-14T22:50:00Z',
  });
}

describe('calculateReportStatistics in the user timezone', () => {
  it('should divide the all-time total by the local days since the first log', () => {
    // Arrange
    const logs = [
      anHourLogOn('l1', '2026-07-12'),
      anHourLogOn('l2', '2026-07-13'),
      anHourLogOn('l3', '2026-07-14'),
      anHourLogOn('l4', '2026-07-15'),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso: NOW_ISO,
      reportPeriod: 'all',
      reportSort: 'duration',
      timeZone: WARSAW,
    });

    // Assert
    expect(result.periodTotalSec).toBe(4 * 3600);
    expect(result.dailyAverageSec).toBe(3600);
    expect(result.dailyAverageSec).not.toBe(result.periodTotalSec);
  });

  it('should count days from the earliest patch when patches are included in reports', () => {
    // Arrange
    const logs = [anHourLogOn('l1', '2026-07-14'), anHourLogOn('l2', '2026-07-15')];
    const patches = [
      aPatchLog({
        id: 'pt1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-07-10T08:00:00Z',
        endTime: '2026-07-10T08:30:00Z',
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches,
      projects,
      tasks,
      nowIso: NOW_ISO,
      reportPeriod: 'all',
      reportSort: 'duration',
      sysSettings: { includePatchesInReports: true, autoStart: false, activeSinks: [] },
      timeZone: WARSAW,
    });

    // Assert
    expect(result.periodTotalSec).toBe(2 * 3600 + 1800);
    expect(result.dailyAverageSec).toBe(Math.round((2 * 3600 + 1800) / 6));
  });

  it('should ignore logs outside the project scope when counting days for all', () => {
    // Arrange
    const logs = [anHourLogOn('l-old-beta', '2026-07-01', 't2', 'p2'), anHourLogOn('l-alpha', '2026-07-14')];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso: NOW_ISO,
      reportPeriod: 'all',
      reportSort: 'duration',
      projectIds: ['p1'],
      timeZone: WARSAW,
    });

    // Assert
    expect(result.periodTotalSec).toBe(3600);
    expect(result.dailyAverageSec).toBe(1800);
  });

  it('should attribute a log at 00:10 local to today when the UTC date is still yesterday', () => {
    // Arrange
    const logs = [aLogAfterLocalMidnight()];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso: NOW_ISO,
      reportPeriod: 'today',
      reportSort: 'duration',
      timeZone: WARSAW,
    });

    // Assert
    expect(result.todaySec).toBe(2400);
    expect(result.periodTotalSec).toBe(2400);
  });

  it('should not attribute a log at 00:10 local to yesterday when the UTC date is still yesterday', () => {
    // Arrange
    const logs = [aLogAfterLocalMidnight()];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso: NOW_ISO,
      reportPeriod: 'yesterday',
      reportSort: 'duration',
      timeZone: WARSAW,
    });

    // Assert
    expect(result.periodTotalSec).toBe(0);
  });

  it('should include the chosen last custom day in the period total and the average divisor', () => {
    // Arrange: 23:30 local on the chosen last day 2026-07-03
    const logs = [
      aTimeLog({
        id: 'l-last-day',
        taskId: 't1',
        projectId: 'p1',
        startTime: '2026-07-03T21:30:00Z',
        endTime: '2026-07-03T21:50:00Z',
      }),
    ];

    // Act
    const result = calculateReportStatistics({
      logs,
      patches: [],
      projects,
      tasks,
      nowIso: NOW_ISO,
      reportPeriod: 'custom',
      customFrom: '2026-07-01',
      customTo: '2026-07-03',
      reportSort: 'duration',
      timeZone: WARSAW,
    });

    // Assert
    expect(result.periodTotalSec).toBe(1200);
    expect(result.dailyAverageSec).toBe(400);
  });
});

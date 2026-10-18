import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserMetricsEngine } from '@plugins/engine/services/BrowserMetricsEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { aProject, aTask, aTimeLog } from '../../../../shared/builders/entity-builders';

describe('BrowserMetricsEngine', () => {
  let routerMock: PersistenceRouter;
  let engine: BrowserMetricsEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    routerMock = {
      core: {
        load: vi.fn(),
      },
      patches: {
        getAll: vi.fn(),
      },
    } as unknown as PersistenceRouter;
    engine = new BrowserMetricsEngine(routerMock);
  });

  it('should return empty default metrics when state is null', async () => {
    // Arrange
    vi.mocked(routerMock.core.load).mockResolvedValueOnce(null);

    // Act
    const metrics = await engine.getComputedMetrics('2026-06-15T12:00:00Z');

    // Assert
    expect(metrics.snapshotNowIso).toBe('2026-06-15T12:00:00Z');
    expect(metrics.tasks).toEqual({});
    expect(metrics.projects).toEqual({});
  });

  it('should compute metrics when state exists', async () => {
    // Arrange
    const proj = aProject({ id: 'p1' });
    const task = aTask({ id: 't1', projectId: 'p1' });
    const log = aTimeLog({
      id: 'l1',
      taskId: 't1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
    });

    vi.mocked(routerMock.core.load).mockResolvedValueOnce({
      projects: [proj],
      tasks: [task],
      logs: [log],
      activeLog: null,
    });

    // Act
    const metrics = await engine.getComputedMetrics('2026-06-15T12:00:00Z');

    // Assert
    expect(metrics.projects['p1']).toBeDefined();
    expect(metrics.tasks['t1']).toBeDefined();
    expect(metrics.tasks['t1'].elapsedSeconds).toBe(3600);
  });

  it('should calculate project statistics accurately', async () => {
    // Arrange
    const proj = aProject({ id: 'p1' });
    const t1 = aTask({ id: 't1', projectId: 'p1', completed: true });
    const t2 = aTask({ id: 't2', projectId: 'p1', completed: false });
    const log1 = aTimeLog({
      id: 'l1',
      taskId: 't1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
    });

    vi.mocked(routerMock.core.load).mockResolvedValueOnce({
      projects: [proj],
      tasks: [t1, t2],
      logs: [log1],
      activeLog: null,
    });

    // Act
    const stats = await engine.getProjectStatistics('p1');

    // Assert
    expect(stats.totalTasks).toBe(2);
    expect(stats.completedTasks).toBe(1);
    expect(stats.totalDurationSec).toBe(3600);
  });

  it('should return 0 elapsed time when state is null', async () => {
    // Arrange
    vi.mocked(routerMock.core.load).mockResolvedValueOnce(null);

    // Act & Assert
    expect(await engine.getTaskElapsed('t1')).toBe(0);
    expect(await engine.getProjectElapsed('p1')).toBe(0);
    expect(await engine.getElapsedRange({ from: '2026-06-15T00:00:00Z' })).toBe(0);
  });

  it('should return empty range metrics when state is null', async () => {
    // Arrange
    vi.mocked(routerMock.core.load).mockResolvedValueOnce(null);

    // Act
    const result = await engine.getRangeMetrics({ from: '2026-06-15T00:00:00Z' });

    // Assert
    expect(result.totalSeconds).toBe(0);
    expect(result.projectElapsed).toEqual({});
    expect(result.taskElapsed).toEqual({});
    expect(result.clampedLogs).toEqual([]);
  });

  it('should calculate range metrics with multi-day clamping and patch logs', async () => {
    // Arrange
    const proj = aProject({ id: 'p1' });
    const task = aTask({ id: 't1', projectId: 'p1' });
    // Overnight log: 22:00 to 02:00 (4 hours = 14400s)
    const log = aTimeLog({
      id: 'l1',
      projectId: 'p1',
      taskId: 't1',
      startTime: '2026-06-15T22:00:00Z',
      endTime: '2026-06-16T02:00:00Z',
    });
    // Patch log inside window on 2026-06-16: 08:00 to 09:00 (1 hour = 3600s)
    const patch = {
      id: 'pt1',
      projectId: 'p1',
      taskId: 't1',
      startTime: '2026-06-16T08:00:00Z',
      endTime: '2026-06-16T09:00:00Z',
      patchNote: 'Test patch',
    };

    vi.mocked(routerMock.core.load).mockResolvedValueOnce({
      projects: [proj],
      tasks: [task],
      logs: [log],
      activeLog: null,
    });
    vi.mocked(routerMock.patches.getAll).mockResolvedValueOnce([patch]);

    // Query window: 2026-06-16 full day
    const filter = {
      from: '2026-06-16T00:00:00Z',
      to: '2026-06-16T23:59:59Z',
      includePatches: true,
    };

    // Act
    const result = await engine.getRangeMetrics(filter, '2026-06-16T12:00:00Z');

    // Assert
    // Clamped log: 00:00 to 02:00 = 2 hours = 7200s
    // Clamped patch: 08:00 to 09:00 = 1 hour = 3600s
    // Total = 10800s
    expect(result.totalSeconds).toBe(10800);
    expect(result.projectElapsed['p1']).toBe(10800);
    expect(result.taskElapsed['t1']).toBe(10800);
    expect(result.clampedLogs).toHaveLength(2);

    const clampedLog = result.clampedLogs.find((l) => l.id === 'l1')!;
    expect(clampedLog.originalDurationSeconds).toBe(14400);
    expect(clampedLog.clampedDurationSeconds).toBe(7200);
    expect(clampedLog.isMultiDaySegment).toBe(true);
    expect(clampedLog.isPatch).toBe(false);

    const clampedPatch = result.clampedLogs.find((l) => l.id === 'pt1')!;
    expect(clampedPatch.originalDurationSeconds).toBe(3600);
    expect(clampedPatch.clampedDurationSeconds).toBe(3600);
    expect(clampedPatch.isMultiDaySegment).toBe(false);
    expect(clampedPatch.isPatch).toBe(true);
  });
});

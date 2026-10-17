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
});

import { describe, it, expect, vi } from 'vitest';
import { EngineRouter } from '@common/engine/EngineRouter';
import { IEngine } from '@common/engine/IEngine';

describe('Unit Tests: EngineRouter', () => {
  it('should delegate all calls to the active implementation', async () => {
    const mockImplementation: IEngine = {
      startTimer: vi.fn().mockResolvedValue(undefined),
      stopTimer: vi.fn().mockResolvedValue(undefined),
      resumeTimer: vi.fn().mockResolvedValue(undefined),
      getActiveLogs: vi.fn().mockResolvedValue(['log-1']),
      getTaskElapsed: vi.fn().mockResolvedValue(100),
      getProjectElapsed: vi.fn().mockResolvedValue(200),
      getElapsedRange: vi.fn().mockResolvedValue(300),
      editTimeLog: vi.fn().mockResolvedValue(undefined),
      getProjectStatistics: vi.fn().mockResolvedValue({ totalDurationSec: 0, totalTasks: 0, completedTasks: 0 }),
      getComputedMetrics: vi.fn().mockResolvedValue({ snapshotNowIso: '2026-06-15T12:00:00Z', tasks: {}, projects: {} }),
    };

    const router = EngineRouter.getInstance();
    router.setImplementationForTesting(mockImplementation);

    await router.startTimer('task-123');
    expect(mockImplementation.startTimer).toHaveBeenCalledWith('task-123');

    await router.stopTimer('project-456');
    expect(mockImplementation.stopTimer).toHaveBeenCalledWith('project-456');

    await router.resumeTimer('task-123');
    expect(mockImplementation.resumeTimer).toHaveBeenCalledWith('task-123');

    const activeLogs = await router.getActiveLogs();
    expect(activeLogs).toEqual(['log-1']);

    const taskElapsed = await router.getTaskElapsed('task-123');
    expect(taskElapsed).toBe(100);

    const projElapsed = await router.getProjectElapsed('project-456');
    expect(projElapsed).toBe(200);

    const rangeElapsed = await router.getElapsedRange({ taskId: 'task-123' });
    expect(rangeElapsed).toBe(300);

    await router.editTimeLog('id-1', 'task-1', 'start', 'end', 'note', 'reason');
    expect(mockImplementation.editTimeLog).toHaveBeenCalledWith('id-1', 'task-1', 'start', 'end', 'note', 'reason');

    await router.getProjectStatistics('project-456');
    expect(mockImplementation.getProjectStatistics).toHaveBeenCalledWith('project-456');

    const metrics = await router.getComputedMetrics();
    expect(metrics.snapshotNowIso).toBe('2026-06-15T12:00:00Z');
  });

  it('should provide fallback defaults when optional methods are missing in implementation', async () => {
    const minimalImpl: IEngine = {
      startTimer: vi.fn().mockResolvedValue(undefined),
      stopTimer: vi.fn().mockResolvedValue(undefined),
      editTimeLog: vi.fn().mockResolvedValue(undefined),
      getProjectStatistics: vi.fn().mockResolvedValue({ totalDurationSec: 0, totalTasks: 0, completedTasks: 0 }),
    };

    const router = EngineRouter.getInstance();
    router.setImplementationForTesting(minimalImpl);

    await router.resumeTimer('task-123');
    expect(minimalImpl.startTimer).toHaveBeenCalledWith('task-123');

    const activeLogs = await router.getActiveLogs();
    expect(activeLogs).toEqual([]);

    const taskElapsed = await router.getTaskElapsed('task-123');
    expect(taskElapsed).toBe(0);

    const projElapsed = await router.getProjectElapsed('project-456');
    expect(projElapsed).toBe(0);

    const metrics = await router.getComputedMetrics('2026-06-15T12:00:00Z');
    expect(metrics.snapshotNowIso).toBe('2026-06-15T12:00:00Z');
  });
});

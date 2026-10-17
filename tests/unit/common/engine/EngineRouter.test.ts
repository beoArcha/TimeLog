import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EngineRouter } from '@common/engine/EngineRouter';
import { IEngine } from '@common/engine/IEngine';

describe('Unit Tests: EngineRouter', () => {
  let mockEngine: IEngine;

  beforeEach(() => {
    mockEngine = {
      timer: {
        startTimer: vi.fn().mockResolvedValue(undefined),
        stopTimer: vi.fn().mockResolvedValue(undefined),
        resumeTimer: vi.fn().mockResolvedValue(undefined),
        getActiveLogs: vi.fn().mockResolvedValue(['log-1']),
      },
      metrics: {
        getTaskElapsed: vi.fn().mockResolvedValue(100),
        getProjectElapsed: vi.fn().mockResolvedValue(200),
        getElapsedRange: vi.fn().mockResolvedValue(300),
        getProjectStatistics: vi.fn().mockResolvedValue({ totalDurationSec: 0, totalTasks: 0, completedTasks: 0 }),
        getComputedMetrics: vi.fn().mockResolvedValue({ snapshotNowIso: '2026-06-15T12:00:00Z', tasks: {}, projects: {} }),
      },
      timeLogs: {
        editTimeLog: vi.fn().mockResolvedValue(undefined),
      },
      validation: {
        validateProjectName: vi.fn().mockResolvedValue(undefined),
        validateTaskName: vi.fn().mockResolvedValue(undefined),
        validateTaskHierarchy: vi.fn().mockResolvedValue(undefined),
      },
    };

    EngineRouter.resetForTesting();
  });

  it('should expose segregated domain sub-interfaces directly', async () => {
    // Arrange
    const router = EngineRouter.getInstance();
    router.setImplementationForTesting(mockEngine);

    // Act
    await router.timer.startTimer('task-123');
    await router.metrics.getTaskElapsed('task-123');
    await router.timeLogs.editTimeLog('id-1', 'task-1', 'start', 'end', 'note', 'reason');
    await router.validation.validateProjectName('Proj', []);

    // Assert
    expect(mockEngine.timer.startTimer).toHaveBeenCalledWith('task-123');
    expect(mockEngine.metrics.getTaskElapsed).toHaveBeenCalledWith('task-123', undefined);
    expect(mockEngine.timeLogs.editTimeLog).toHaveBeenCalledWith('id-1', 'task-1', 'start', 'end', 'note', 'reason');
    expect(mockEngine.validation.validateProjectName).toHaveBeenCalledWith('Proj', [], undefined);
  });

  it('should delegate all facade helper methods to the segregated sub-services', async () => {
    // Arrange
    const router = EngineRouter.getInstance();
    router.setImplementationForTesting(mockEngine);

    // Act
    await router.startTimer('task-123');
    await router.stopTimer('project-456');
    await router.resumeTimer('task-123');
    const activeLogs = await router.getActiveLogs();
    const taskElapsed = await router.getTaskElapsed('task-123');
    const projElapsed = await router.getProjectElapsed('project-456');
    const rangeElapsed = await router.getElapsedRange({ from: '2026-06-15T00:00:00Z' });
    await router.editTimeLog('id-1', 'task-1', 'start', 'end', 'note', 'reason');
    await router.getProjectStatistics('project-456');
    const metrics = await router.getComputedMetrics();
    await router.validateProjectName('Proj', []);
    await router.validateTaskName('Task');
    await router.validateTaskHierarchy(null, null, []);

    // Assert
    expect(mockEngine.timer.startTimer).toHaveBeenCalledWith('task-123');
    expect(mockEngine.timer.stopTimer).toHaveBeenCalledWith('project-456');
    expect(mockEngine.timer.resumeTimer).toHaveBeenCalledWith('task-123');
    expect(activeLogs).toEqual(['log-1']);
    expect(taskElapsed).toBe(100);
    expect(projElapsed).toBe(200);
    expect(rangeElapsed).toBe(300);
    expect(mockEngine.timeLogs.editTimeLog).toHaveBeenCalledWith('id-1', 'task-1', 'start', 'end', 'note', 'reason');
    expect(mockEngine.metrics.getProjectStatistics).toHaveBeenCalledWith('project-456');
    expect(metrics.snapshotNowIso).toBe('2026-06-15T12:00:00Z');
    expect(mockEngine.validation.validateProjectName).toHaveBeenCalledWith('Proj', [], undefined);
    expect(mockEngine.validation.validateTaskName).toHaveBeenCalledWith('Task');
    expect(mockEngine.validation.validateTaskHierarchy).toHaveBeenCalledWith(null, null, []);
  });
});

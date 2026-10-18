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
        getRangeMetrics: vi.fn().mockResolvedValue({ totalSeconds: 300, projectElapsed: {}, taskElapsed: {}, clampedLogs: [] }),
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

  it('should expose segregated domain sub-interfaces directly and delegate method calls', async () => {
    // Arrange
    const router = EngineRouter.getInstance();
    router.setImplementationForTesting(mockEngine);

    // Act
    await router.timer.startTimer('task-123');
    await router.timer.stopTimer('project-456');
    await router.timer.resumeTimer('task-123');
    const activeLogs = await router.timer.getActiveLogs();

    const taskElapsed = await router.metrics.getTaskElapsed('task-123');
    const projElapsed = await router.metrics.getProjectElapsed('project-456');
    const rangeElapsed = await router.metrics.getElapsedRange({ from: '2026-06-15T00:00:00Z' });
    const stats = await router.metrics.getProjectStatistics('project-456');
    const computedMetrics = await router.metrics.getComputedMetrics();

    await router.timeLogs.editTimeLog('id-1', 'task-1', 'start', 'end', 'note', 'reason');

    await router.validation.validateProjectName('Proj', []);
    await router.validation.validateTaskName('Task');
    await router.validation.validateTaskHierarchy(null, null, []);

    // Assert
    expect(mockEngine.timer.startTimer).toHaveBeenCalledWith('task-123');
    expect(mockEngine.timer.stopTimer).toHaveBeenCalledWith('project-456');
    expect(mockEngine.timer.resumeTimer).toHaveBeenCalledWith('task-123');
    expect(activeLogs).toEqual(['log-1']);

    expect(mockEngine.metrics.getTaskElapsed).toHaveBeenCalledWith('task-123');
    expect(taskElapsed).toBe(100);
    expect(mockEngine.metrics.getProjectElapsed).toHaveBeenCalledWith('project-456');
    expect(projElapsed).toBe(200);
    expect(mockEngine.metrics.getElapsedRange).toHaveBeenCalledWith({ from: '2026-06-15T00:00:00Z' });
    expect(rangeElapsed).toBe(300);
    expect(mockEngine.metrics.getProjectStatistics).toHaveBeenCalledWith('project-456');
    expect(stats).toEqual({ totalDurationSec: 0, totalTasks: 0, completedTasks: 0 });
    expect(computedMetrics.snapshotNowIso).toBe('2026-06-15T12:00:00Z');

    expect(mockEngine.timeLogs.editTimeLog).toHaveBeenCalledWith('id-1', 'task-1', 'start', 'end', 'note', 'reason');

    expect(mockEngine.validation.validateProjectName).toHaveBeenCalledWith('Proj', []);
    expect(mockEngine.validation.validateTaskName).toHaveBeenCalledWith('Task');
    expect(mockEngine.validation.validateTaskHierarchy).toHaveBeenCalledWith(null, null, []);
  });

  it('should switch active implementation when setImplementationForTesting is called', () => {
    // Arrange
    const router = EngineRouter.getInstance();
    const customEngine: IEngine = {
      timer: { ...mockEngine.timer },
      metrics: { ...mockEngine.metrics },
      timeLogs: { ...mockEngine.timeLogs },
      validation: { ...mockEngine.validation },
    };

    // Act
    router.setImplementationForTesting(customEngine);

    // Assert
    expect(router.timer).toBe(customEngine.timer);
    expect(router.metrics).toBe(customEngine.metrics);
    expect(router.timeLogs).toBe(customEngine.timeLogs);
    expect(router.validation).toBe(customEngine.validation);
  });

  it('should reset singleton instance when resetForTesting is invoked', () => {
    // Arrange
    const instanceA = EngineRouter.getInstance();

    // Act
    EngineRouter.resetForTesting();
    const instanceB = EngineRouter.getInstance();

    // Assert
    expect(instanceA).not.toBe(instanceB);
  });
});

import { describe, it, expect } from 'vitest';
import { calculateSandboxMetrics } from '@features/cli/sandbox/sandboxMetricsCalculator';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: sandboxMetricsCalculator', () => {
  it('should calculate project and task elapsed metrics from running and completed logs', () => {
    // Arrange
    const projects = [aProject({ id: 'p1', name: 'Project 1' })];
    const tasks = [aTask({ id: 't1', projectId: 'p1', name: 'Task 1' })];
    const logs = [
      aTimeLog({
        id: 'l1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-15T08:00:00Z',
        endTime: '2026-06-15T09:00:00Z',
      }),
      aTimeLog({
        id: 'l2',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-15T09:30:00Z',
        endTime: null,
      }),
    ];
    const nowIso = '2026-06-15T10:00:00Z'; // 30 minutes running

    // Act
    const metrics = calculateSandboxMetrics(projects, tasks, logs, nowIso);

    // Assert
    expect(metrics.snapshotNowIso).toBe(nowIso);
    expect(metrics.projects.p1).toBeDefined();
    // 3600 (l1) + 1800 (l2) = 5400 seconds
    expect(metrics.projects.p1?.totalElapsedSeconds).toBe(5400);
    expect(metrics.projects.p1?.isRunning).toBe(true);
    expect(metrics.tasks.t1?.elapsedSeconds).toBe(5400);
    expect(metrics.tasks.t1?.isRunning).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TauriMetricsEngine } from '@common/engine/commands/TauriMetricsEngine';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('TauriMetricsEngine', () => {
  let engine: TauriMetricsEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new TauriMetricsEngine();
  });

  it('should invoke get_computed_metrics when getComputedMetrics is called', async () => {
    // Arrange
    const mockMetrics = {
      snapshotNowIso: '2026-06-15T12:00:00Z',
      tasks: {},
      projects: {},
    };
    vi.mocked(invoke).mockResolvedValueOnce(mockMetrics);

    // Act
    const result = await engine.getComputedMetrics('2026-06-15T12:00:00Z');

    // Assert
    expect(invoke).toHaveBeenCalledWith('get_computed_metrics', { nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toEqual(mockMetrics);
  });

  it('should invoke get_task_elapsed when getTaskElapsed is called', async () => {
    // Arrange
    vi.mocked(invoke).mockResolvedValueOnce(3600);

    // Act
    const result = await engine.getTaskElapsed('task-1', '2026-06-15T12:00:00Z');

    // Assert
    expect(invoke).toHaveBeenCalledWith('get_task_elapsed', { taskId: 'task-1', nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toBe(3600);
  });

  it('should invoke get_project_elapsed when getProjectElapsed is called', async () => {
    // Arrange
    vi.mocked(invoke).mockResolvedValueOnce(7200);

    // Act
    const result = await engine.getProjectElapsed('proj-1', '2026-06-15T12:00:00Z');

    // Assert
    expect(invoke).toHaveBeenCalledWith('get_project_elapsed', { projectId: 'proj-1', nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toBe(7200);
  });

  it('should invoke get_elapsed_range when getElapsedRange is called', async () => {
    // Arrange
    vi.mocked(invoke).mockResolvedValueOnce(1800);

    const filter = { from: '2026-06-15T00:00:00Z', to: '2026-06-15T23:59:59Z' };
    const result = await engine.getElapsedRange(filter, '2026-06-15T12:00:00Z');

    // Assert
    expect(invoke).toHaveBeenCalledWith('get_elapsed_range', { range: filter, nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toBe(1800);
  });

  it('should invoke get_project_statistics when getProjectStatistics is called', async () => {
    // Arrange
    const stats = { totalDurationSec: 500, totalTasks: 4, completedTasks: 2 };
    vi.mocked(invoke).mockResolvedValueOnce(stats);

    // Act
    const result = await engine.getProjectStatistics('proj-1');

    // Assert
    expect(invoke).toHaveBeenCalledWith('get_project_statistics', { projectId: 'proj-1' });
    expect(result).toEqual(stats);
  });
});

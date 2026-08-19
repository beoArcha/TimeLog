import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useComputedMetrics } from '@common/hooks/useComputedMetrics';
import * as DataContextModule from '@common/hooks/DataContext';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';

describe('Unit Tests: useComputedMetrics Hook', () => {
  it('should return computed metrics from DataContext', () => {
    const mockMetrics: EngineComputedMetrics = {
      snapshotNowIso: '2026-06-15T12:00:00.000Z',
      tasks: {
        task_1: {
          taskId: 'task_1',
          elapsedSeconds: 3600,
          selfElapsedSeconds: 1800,
          isRunning: true,
          hasRunningChild: false,
        },
      },
      projects: {
        proj_1: {
          projectId: 'proj_1',
          totalElapsedSeconds: 7200,
          todayElapsedSeconds: 3600,
          thisWeekElapsedSeconds: 7200,
          activeTaskCount: 1,
          completedTaskCount: 2,
          isRunning: true,
        },
      },
    };

    const mockRefresh = vi.fn().mockResolvedValue(mockMetrics);

    vi.spyOn(DataContextModule, 'useData').mockReturnValue({
      computedMetrics: mockMetrics,
      refreshComputedMetrics: mockRefresh,
    } as any);

    const { result } = renderHook(() => useComputedMetrics());

    expect(result.current.metrics).toEqual(mockMetrics);
    expect(result.current.getTaskMetrics('task_1')).toEqual(mockMetrics.tasks['task_1']);
    expect(result.current.getProjectMetrics('proj_1')).toEqual(mockMetrics.projects['proj_1']);
    expect(result.current.getTaskMetrics('nonexistent')).toBeUndefined();
  });
});

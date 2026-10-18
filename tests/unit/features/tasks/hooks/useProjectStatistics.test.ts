import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectStatistics } from '@features/tasks/hooks/useProjectStatistics';
import { Project } from '@bindings/Project';
import { EngineRouter } from '@common/engine/EngineRouter';
import { IEngine } from '@common/engine/IEngine';

describe('Unit Tests: useProjectStatistics', () => {
  const mockGetProjectStatistics = vi.fn();
  const mockImpl: IEngine = {
    timer: {
      startTimer: vi.fn(),
      stopTimer: vi.fn(),
      resumeTimer: vi.fn(),
      getActiveLogs: vi.fn(),
    },
    metrics: {
      getComputedMetrics: vi.fn(),
      getTaskElapsed: vi.fn(),
      getProjectElapsed: vi.fn(),
      getElapsedRange: vi.fn(),
      getRangeMetrics: vi.fn(),
      getProjectStatistics: mockGetProjectStatistics,
    },
    timeLogs: {
      editTimeLog: vi.fn(),
    },
    validation: {
      validateProjectName: vi.fn(),
      validateTaskName: vi.fn(),
      validateTaskHierarchy: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    EngineRouter.getInstance().setImplementationForTesting(mockImpl);
  });

  const selectedProj: Project = {
    id: 'p1',
    name: 'Project One',
    color: 'indigo',
    createdAt: '2026-06-15T00:00:00Z',
    archived: false,
    description: null,
    icon: null,
    tags: null
  };

  it('should return default state when selectedProject is null', () => {
    const { result } = renderHook(() => useProjectStatistics({
      selectedProject: null,
      tasks: [],
      logs: [],
      nowIso: '2026-06-15T12:00:00Z'
    }));

    expect(result.current.stats).toBeNull();
    expect(result.current.projectDurationSeconds).toBe(0);
  });

  it('should load statistics when selectedProject is provided', async () => {
    mockGetProjectStatistics.mockResolvedValue({
      totalTasks: 4,
      completedTasks: 2,
      totalDurationSeconds: 7200
    });

    const { result } = renderHook(() => useProjectStatistics({
      selectedProject: selectedProj,
      tasks: [],
      logs: [],
      nowIso: '2026-06-15T12:00:00Z'
    }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.stats).toEqual({
      totalTasks: 4,
      completedTasks: 2,
      totalDurationSeconds: 7200
    });
    expect(mockGetProjectStatistics).toHaveBeenCalledWith('p1');
  });

  it('should compute statistics synchronously when metrics are provided without loading flicker', () => {
    const mockMetrics: import('@bindings/EngineComputedMetrics').EngineComputedMetrics = {
      snapshotNowIso: '2026-06-15T12:00:00Z',
      tasks: {},
      projects: {
        p1: {
          projectId: 'p1',
          totalElapsedSeconds: 3600,
          todayElapsedSeconds: 1800,
          thisWeekElapsedSeconds: 3600,
          activeTaskCount: 5,
          completedTaskCount: 3,
          isRunning: true,
        },
      },
    };

    const { result } = renderHook(() => useProjectStatistics({
      selectedProject: selectedProj,
      tasks: [],
      logs: [],
      nowIso: '2026-06-15T12:00:00Z',
      metrics: mockMetrics,
    }));

    expect(result.current.loading).toBe(false);
    expect(result.current.projectDurationSeconds).toBe(3600);
    expect(result.current.stats).toEqual({
      totalDurationSec: 3600,
      totalTasks: 8,
      completedTasks: 3,
    });

    expect(mockGetProjectStatistics).not.toHaveBeenCalled();
  });

  it('should handle error when async statistics fetch fails', async () => {
    mockGetProjectStatistics.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useProjectStatistics({
      selectedProject: selectedProj,
    }));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.stats).toBeNull();
  });

  it('should reset stats and loading state when selectedProject changes', async () => {
    mockGetProjectStatistics.mockImplementation(async (id: string) => {
      if (id === 'p2') {
        return {
          totalTasks: 10,
          completedTasks: 5,
          totalDurationSec: 1000,
        };
      }
      return {
        totalTasks: 4,
        completedTasks: 2,
        totalDurationSec: 7200,
      };
    });

    const { result, rerender } = renderHook(
      ({ project }: { project: Project | null }) =>
        useProjectStatistics({ selectedProject: project }),
      { initialProps: { project: selectedProj } }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.stats?.totalTasks).toBe(4);

    const projectTwo: Project = {
      ...selectedProj,
      id: 'p2',
      name: 'Project Two',
    };

    rerender({ project: projectTwo });

    expect(result.current.loading).toBe(true);
    expect(result.current.stats).toBeNull();

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.stats?.totalTasks).toBe(10);
  });
});

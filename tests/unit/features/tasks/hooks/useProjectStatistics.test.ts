import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectStatistics } from '@features/tasks/hooks/useProjectStatistics';
import { Project } from '@bindings/Project';
import { EngineRouter } from '@common/engine/EngineRouter';
import { IEngine } from '@common/engine/IEngine';

describe('Unit Tests: useProjectStatistics', () => {
  const mockGetProjectStatistics = vi.fn();
  const mockImpl: IEngine = {
    startTimer: vi.fn(),
    stopTimer: vi.fn(),
    editTimeLog: vi.fn(),
    getProjectStatistics: mockGetProjectStatistics,
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
});

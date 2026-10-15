import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjectsManager } from '@common/hooks/data/useProjectsManager';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { createMockRepositoryState, createMockActionRunner } from './test-doubles';

describe('Unit Tests: useProjectsManager Hook', () => {
  const router = PersistenceRouter.getInstance();

  const mockRepositoryState = createMockRepositoryState({
    projects: [
      { id: 'p1', name: 'Existing Project', color: 'blue', createdAt: '2026-01-01', archived: false, description: null, icon: null, tags: null },
    ],
  });

  const mockActionRunner = createMockActionRunner();

  const refreshComputedMetrics = vi.fn().mockResolvedValue(null);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a project and update state and refresh metrics', async () => {
    const updatedProjects = [
      ...mockRepositoryState.projects,
      { id: 'p2', name: 'New Project', color: 'green', createdAt: '2026-01-02', archived: false, description: null, icon: null, tags: null },
    ];
    vi.spyOn(router.projects, 'add').mockResolvedValue({
      projects: updatedProjects,
      tasks: [],
      logs: [],
      activeLog: null,
    });

    const { result } = renderHook(() =>
      useProjectsManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    await act(async () => {
      await result.current.handleAddProject('New Project', 'green');
    });

    expect(mockRepositoryState.setProjectsState).toHaveBeenCalledWith(updatedProjects);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should toggle project archive and update projects and logs', async () => {
    const toggledProjects = [
      { ...mockRepositoryState.projects[0], archived: true },
    ];
    vi.spyOn(router.projects, 'toggleArchive').mockResolvedValue({
      projects: toggledProjects,
      tasks: [],
      logs: [],
      activeLog: null,
    });

    const { result } = renderHook(() =>
      useProjectsManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    await act(async () => {
      await result.current.handleToggleProjectArchive('p1');
    });

    expect(mockRepositoryState.setProjectsState).toHaveBeenCalledWith(toggledProjects);
    expect(mockRepositoryState.setLogsState).toHaveBeenCalledWith([]);
    expect(mockRepositoryState.setActiveLogState).toHaveBeenCalledWith(null);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should rename project when handleRenameProject is called', async () => {
    const renamedProjects = [
      { ...mockRepositoryState.projects[0], name: 'Renamed Name' },
    ];
    vi.spyOn(router.projects, 'rename').mockResolvedValue({
      projects: renamedProjects,
      tasks: [],
      logs: [],
      activeLog: null,
    });

    const { result } = renderHook(() =>
      useProjectsManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    await act(async () => {
      await result.current.handleRenameProject('p1', 'Renamed Name');
    });

    expect(mockRepositoryState.setProjectsState).toHaveBeenCalledWith(renamedProjects);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });
});

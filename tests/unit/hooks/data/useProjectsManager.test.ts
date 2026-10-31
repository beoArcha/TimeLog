import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useProjectsManager } from '@common/hooks/data/useProjectsManager';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { useAsyncActionRunner } from '@common/hooks/data/useAsyncActionRunner';
import { ErrorHandler } from '@common/exceptions';
import type { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { createMockRepositoryState, createMockActionRunner } from './test-doubles';

describe('Unit Tests: useProjectsManager Hook', () => {
  const router = PersistenceRouter.getInstance();

  const mockRepositoryState = createMockRepositoryState({
    projects: [
      {
        id: 'p1',
        name: 'Existing Project',
        color: 'blue',
        createdAt: '2026-01-01',
        archived: false,
        description: null,
        icon: null,
        tags: null,
        allowConcurrency: false,
      },
    ],
  });

  const mockActionRunner = createMockActionRunner();
  const refreshComputedMetrics = vi.fn().mockResolvedValue(null);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate handleDeleteProject to persistenceRouter.projects.delete and update repository state and refresh metrics', async () => {
    const nextState: TimerRepositoryState = {
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
      activeLogs: [],
    };

    const deleteSpy = vi.spyOn(router.projects, 'delete').mockResolvedValue(nextState);

    const { result } = renderHook(() =>
      useProjectsManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
        persistenceRouter: router,
      })
    );

    await act(async () => {
      await result.current.handleDeleteProject('p1');
    });

    expect(deleteSpy).toHaveBeenCalledWith('p1');
    expect(mockRepositoryState.syncRepositoryState).toHaveBeenCalledWith(nextState);
    expect(mockRepositoryState.setProjectsState).toHaveBeenCalledWith([]);
    expect(refreshComputedMetrics).toHaveBeenCalled();
    expect(mockActionRunner.runAction).toHaveBeenCalledWith(
      'Failed to delete project',
      expect.any(Function)
    );
  });

  it('should propagate error to actionRunner when persistenceRouter.projects.delete rejects', async () => {
    const deleteError = new Error('Cannot delete project with existing time logs');
    vi.spyOn(router.projects, 'delete').mockRejectedValue(deleteError);
    const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});

    const { result: actionRunnerResult } = renderHook(() => useAsyncActionRunner());

    const { result } = renderHook(() =>
      useProjectsManager({
        repositoryState: mockRepositoryState,
        actionRunner: actionRunnerResult.current,
        refreshComputedMetrics,
        persistenceRouter: router,
      })
    );

    await act(async () => {
      await result.current.handleDeleteProject('p1');
    });

    expect(actionRunnerResult.current.repositoryError).toBe('Cannot delete project with existing time logs');
    expect(errorHandlerSpy).toHaveBeenCalled();
    expect(mockRepositoryState.setProjectsState).not.toHaveBeenCalled();
    expect(refreshComputedMetrics).not.toHaveBeenCalled();
  });

  it('should add a project and update state and refresh metrics', async () => {
    const updatedProjects = [
      ...mockRepositoryState.projects,
      {
        id: 'p2',
        name: 'New Project',
        color: 'green',
        createdAt: '2026-01-02',
        archived: false,
        description: null,
        icon: null,
        tags: null,
        allowConcurrency: false,
      },
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
        persistenceRouter: router,
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
        persistenceRouter: router,
      })
    );

    await act(async () => {
      await result.current.handleToggleProjectArchive('p1');
    });

    expect(mockRepositoryState.setProjectsState).toHaveBeenCalledWith(toggledProjects);
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
        persistenceRouter: router,
      })
    );

    await act(async () => {
      await result.current.handleRenameProject('p1', 'Renamed Name');
    });

    expect(mockRepositoryState.setProjectsState).toHaveBeenCalledWith(renamedProjects);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should update project details when handleUpdateProject is called', async () => {
    const updatedProjects = [
      { ...mockRepositoryState.projects[0], name: 'Updated Name', color: 'purple' },
    ];
    vi.spyOn(router.projects, 'update').mockResolvedValue({
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
        persistenceRouter: router,
      })
    );

    await act(async () => {
      await result.current.handleUpdateProject('p1', 'Updated Name', 'purple');
    });

    expect(mockRepositoryState.setProjectsState).toHaveBeenCalledWith(updatedProjects);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });
});

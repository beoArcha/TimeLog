import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasksManager } from '@common/hooks/data/useTasksManager';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { createMockRepositoryState, createMockActionRunner } from './test-doubles';

describe('Unit Tests: useTasksManager Hook', () => {
  const router = PersistenceRouter.getInstance();

  const mockRepositoryState = createMockRepositoryState({
    tasks: [
      { id: 't1', projectId: 'p1', parentTaskId: null, name: 'Task 1', createdAt: '2026-01-01', completed: false, status: null },
    ],
  });

  const mockActionRunner = createMockActionRunner();

  const refreshComputedMetrics = vi.fn().mockResolvedValue(null);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add task and update tasks state', async () => {
    const updatedTasks = [
      ...mockRepositoryState.tasks,
      { id: 't2', projectId: 'p1', parentTaskId: null, name: 'Task 2', createdAt: '2026-01-02', completed: false, status: null },
    ];
    vi.spyOn(router.tasks, 'add').mockResolvedValue({
      projects: [],
      tasks: updatedTasks,
      logs: [],
      activeLog: null,
    });

    const { result } = renderHook(() =>
      useTasksManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    await act(async () => {
      await result.current.handleAddTask('p1', 'Task 2', null);
    });

    expect(mockRepositoryState.setTasksState).toHaveBeenCalledWith(updatedTasks);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should toggle task completion and cascade updates to logs', async () => {
    const updatedTasks = [
      { ...mockRepositoryState.tasks[0], completed: true },
    ];
    vi.spyOn(router.tasks, 'toggleComplete').mockResolvedValue({
      projects: [],
      tasks: updatedTasks,
      logs: [],
      activeLog: null,
    });

    const { result } = renderHook(() =>
      useTasksManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    await act(async () => {
      await result.current.handleToggleTaskComplete('t1');
    });

    expect(mockRepositoryState.setTasksState).toHaveBeenCalledWith(updatedTasks);
    expect(mockRepositoryState.setLogsState).toHaveBeenCalledWith([]);
    expect(mockRepositoryState.setActiveLogState).toHaveBeenCalledWith(null);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should allow setting selectedTaskId', () => {
    const { result } = renderHook(() =>
      useTasksManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    expect(result.current.selectedTaskId).toBeNull();

    act(() => {
      result.current.setSelectedTaskId('t1');
    });

    expect(result.current.selectedTaskId).toBe('t1');
  });
});

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTasksManager } from '@common/hooks/data/useTasksManager';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { aTask } from '@tests/shared/builders/entity-builders';
import { createMockRepositoryState, createMockActionRunner } from './test-doubles';

describe('Unit Tests: useTasksManager Hook', () => {
  const router = PersistenceRouter.getInstance();

  const mockTask1 = aTask({ id: 't1', projectId: 'p1', name: 'Task 1', completed: false });
  const mockRepositoryState = createMockRepositoryState({
    tasks: [mockTask1],
  });

  const mockActionRunner = createMockActionRunner();
  const refreshComputedMetrics = vi.fn().mockResolvedValue(null);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add task and update tasks state', async () => {
    // Arrange
    const updatedTasks = [
      mockTask1,
      aTask({ id: 't2', projectId: 'p1', name: 'Task 2' }),
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

    // Act
    await act(async () => {
      await result.current.handleAddTask('p1', 'Task 2', null);
    });

    // Assert
    expect(mockRepositoryState.setTasksState).toHaveBeenCalledWith(updatedTasks);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should update task details, status, and associated state', async () => {
    // Arrange
    const updatedTasks = [
      { ...mockTask1, name: 'Updated Task 1', status: 'Done' as const, completed: true },
    ];
    vi.spyOn(router.tasks, 'update').mockResolvedValue({
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

    // Act
    await act(async () => {
      await result.current.handleUpdateTask('t1', 'Updated Task 1', null, 'Done', true);
    });

    // Assert
    expect(mockRepositoryState.setTasksState).toHaveBeenCalledWith(updatedTasks);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should rename task and refresh metrics', async () => {
    // Arrange
    const renamedTasks = [{ ...mockTask1, name: 'Renamed Title' }];
    vi.spyOn(router.tasks, 'rename').mockResolvedValue({
      projects: [],
      tasks: renamedTasks,
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

    // Act
    await act(async () => {
      await result.current.handleRenameTask('t1', 'Renamed Title');
    });

    // Assert
    expect(mockRepositoryState.setTasksState).toHaveBeenCalledWith(renamedTasks);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should delete task and update tasks and logs state', async () => {
    // Arrange
    vi.spyOn(router.tasks, 'delete').mockResolvedValue({
      projects: [],
      tasks: [],
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

    // Act
    await act(async () => {
      await result.current.handleDeleteTask('t1');
    });

    // Assert
    expect(mockRepositoryState.setTasksState).toHaveBeenCalledWith([]);
    expect(mockRepositoryState.setLogsState).toHaveBeenCalledWith([]);
    expect(mockRepositoryState.setActiveLogState).toHaveBeenCalledWith(null);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should toggle task completion and cascade updates to logs', async () => {
    // Arrange
    const updatedTasks = [{ ...mockTask1, completed: true }];
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

    // Act
    await act(async () => {
      await result.current.handleToggleTaskComplete('t1');
    });

    // Assert
    expect(mockRepositoryState.setTasksState).toHaveBeenCalledWith(updatedTasks);
    expect(mockRepositoryState.setLogsState).toHaveBeenCalledWith([]);
    expect(mockRepositoryState.setActiveLogState).toHaveBeenCalledWith(null);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should support setTasks with direct array and updater function', async () => {
    // Arrange
    const nextTasks = [aTask({ id: 't-override', name: 'Override' })];
    vi.spyOn(router.core, 'overrideState').mockResolvedValue({
      projects: [],
      tasks: nextTasks,
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

    // Act: direct array
    await act(async () => {
      await result.current.setTasks(nextTasks);
    });

    // Assert
    expect(router.core.overrideState).toHaveBeenCalledWith({ tasks: nextTasks });

    // Act: functional updater
    await act(async () => {
      await result.current.setTasks((prev) => [...prev, aTask({ id: 't-func' })]);
    });

    // Assert
    expect(router.core.overrideState).toHaveBeenCalled();
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });

  it('should allow setting selectedTaskId', () => {
    // Arrange
    const { result } = renderHook(() =>
      useTasksManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        refreshComputedMetrics,
      })
    );

    expect(result.current.selectedTaskId).toBeNull();

    // Act
    act(() => {
      result.current.setSelectedTaskId('t1');
    });

    // Assert
    expect(result.current.selectedTaskId).toBe('t1');
  });
});

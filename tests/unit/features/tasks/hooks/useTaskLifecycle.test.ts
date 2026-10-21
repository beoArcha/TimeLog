import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskLifecycle } from '@features/tasks/hooks/useTaskLifecycle';
import { aTask } from '@tests/shared/builders/entity-builders';

describe('useTaskLifecycle', () => {
  const root1 = aTask({ id: 't1', projectId: 'p1', name: 'Root Task 1', parentTaskId: undefined });
  const sub1 = aTask({ id: 't2', projectId: 'p1', name: 'Subtask 1', parentTaskId: 't1' });
  const otherProjectTask = aTask({ id: 't3', projectId: 'p2', name: 'Other Task', parentTaskId: undefined });

  it('should filter tasks and rootTasks exclusively for the selected project', () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useTaskLifecycle({
        tasks: [root1, sub1, otherProjectTask],
        selectedProjectId: 'p1',
      })
    );

    // Assert
    expect(result.current.projectTasks).toHaveLength(2);
    expect(result.current.rootTasks).toHaveLength(1);
    expect(result.current.rootTasks[0].id).toBe('t1');
  });

  it('should return empty lists when selectedProjectId is null', () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useTaskLifecycle({
        tasks: [root1, sub1],
        selectedProjectId: null,
      })
    );

    // Assert
    expect(result.current.projectTasks).toHaveLength(0);
    expect(result.current.rootTasks).toHaveLength(0);
  });

  it('should create root task and reset draft when handleCreateTask is called with valid name', () => {
    // Arrange
    const onAddTask = vi.fn();
    const { result } = renderHook(() =>
      useTaskLifecycle({
        tasks: [root1],
        selectedProjectId: 'p1',
        onAddTask,
      })
    );

    // Act
    act(() => {
      result.current.setNewTaskName('Brand New Task');
    });
    act(() => {
      result.current.handleCreateTask();
    });

    // Assert
    expect(onAddTask).toHaveBeenCalledWith('p1', 'Brand New Task', null);
    expect(result.current.newTaskName).toBe('');
  });

  it('should ignore creation when task name is whitespace only', () => {
    // Arrange
    const onAddTask = vi.fn();
    const { result } = renderHook(() =>
      useTaskLifecycle({
        tasks: [root1],
        selectedProjectId: 'p1',
        onAddTask,
      })
    );

    // Act
    act(() => {
      result.current.setNewTaskName('   ');
      result.current.handleCreateTask();
    });

    // Assert
    expect(onAddTask).not.toHaveBeenCalled();
  });

  it('should open subtask form and create subtask with parentId', () => {
    // Arrange
    const onAddTask = vi.fn();
    const { result } = renderHook(() =>
      useTaskLifecycle({
        tasks: [root1],
        selectedProjectId: 'p1',
        onAddTask,
      })
    );

    // Act - open form
    act(() => {
      result.current.openSubtaskForm('t1');
    });
    expect(result.current.showSubtaskFormForId).toBe('t1');

    // Act - type and create
    act(() => {
      result.current.setNewSubtaskName('Child Step');
    });
    act(() => {
      result.current.handleCreateSubtask('t1');
    });

    // Assert
    expect(onAddTask).toHaveBeenCalledWith('p1', 'Child Step', 't1');
    expect(result.current.showSubtaskFormForId).toBeNull();
  });

  it('should manage inline task editing and commit rename when valid', () => {
    // Arrange
    const onRenameTask = vi.fn();
    const { result } = renderHook(() =>
      useTaskLifecycle({
        tasks: [root1],
        selectedProjectId: 'p1',
        onRenameTask,
      })
    );

    // Act - start editing
    act(() => {
      result.current.startEditingTask('t1', 'Root Task 1');
    });
    expect(result.current.editingId).toBe('t1');
    expect(result.current.editName).toBe('Root Task 1');

    // Act - update name and commit
    act(() => {
      result.current.setEditName('Updated Root Name');
    });
    act(() => {
      result.current.commitRenameTask('t1');
    });

    // Assert
    expect(onRenameTask).toHaveBeenCalledWith('t1', 'Updated Root Name');
    expect(result.current.editingId).toBeNull();
  });

  it('should delegate completion toggle and delete to handlers', () => {
    // Arrange
    const onToggleTaskComplete = vi.fn();
    const onDeleteTask = vi.fn();
    const { result } = renderHook(() =>
      useTaskLifecycle({
        tasks: [root1],
        selectedProjectId: 'p1',
        onToggleTaskComplete,
        onDeleteTask,
      })
    );

    // Act
    act(() => {
      result.current.handleToggleComplete('t1');
      result.current.handleDeleteTask('t1');
    });

    // Assert
    expect(onToggleTaskComplete).toHaveBeenCalledWith('t1');
    expect(onDeleteTask).toHaveBeenCalledWith('t1');
  });
});

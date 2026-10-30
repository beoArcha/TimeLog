// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import TaskItem, { TaskItemState } from '@features/tasks/components/TaskItem/TaskItem';
import { aTask, aProject } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: TaskItem', () => {
  const rootTask = aTask({
    id: 't1',
    projectId: 'p1',
    name: 'Task Item Name',
    completed: false,
    createdAt: '2026-06-15T00:00:00Z',
    parentTaskId: null,
  });

  const onToggleTaskCompleteMock = vi.fn();
  const onDeleteTaskMock = vi.fn();
  const onStartTimerMock = vi.fn();
  const onStopTimerMock = vi.fn();

  const createMockState = (overrides?: Partial<TaskItemState>): TaskItemState => ({
    tasks: [rootTask],
    logs: [],
    nowIso: '2026-06-15T12:00:00Z',
    projectTasks: [rootTask],
    selectedProject: aProject({ id: 'p1', name: 'Proj 1', color: 'indigo' }),
    onToggleTaskComplete: onToggleTaskCompleteMock,
    onRenameTask: vi.fn(),
    onUpdateTask: vi.fn(),
    onDeleteTask: onDeleteTaskMock,
    onStartTimer: onStartTimerMock,
    onStopTimer: onStopTimerMock,
    onAddTask: vi.fn(),
    ...overrides,
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render task item details and title', () => {
    // Arrange
    const state = createMockState();

    // Act
    render(<TaskItem rootTask={rootTask} state={state} isCondensed={false} />);

    // Assert
    expect(screen.getByText('Task Item Name')).toBeTruthy();
    expect(document.querySelector('#root-task-card-t1')).not.toBeNull();
  });

  it('should trigger onToggleTaskComplete when task checkbox is clicked', () => {
    // Arrange
    const state = createMockState();
    const { container } = render(<TaskItem rootTask={rootTask} state={state} isCondensed={false} />);

    // Act
    const checkbox = container.querySelector('#check-task-t1');
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);

    // Assert
    expect(onToggleTaskCompleteMock).toHaveBeenCalledTimes(1);
    expect(onToggleTaskCompleteMock).toHaveBeenCalledWith('t1');
  });

  it('should trigger onDeleteTask when task delete button is clicked and confirmed', () => {
    // Arrange
    const state = createMockState();
    const { container } = render(<TaskItem rootTask={rootTask} state={state} isCondensed={false} />);

    // Act
    const deleteBtn = container.querySelector('#delete-task-btn-t1');
    expect(deleteBtn).not.toBeNull();
    fireEvent.click(deleteBtn!);

    // Confirmation dialog opens
    expect(onDeleteTaskMock).not.toHaveBeenCalled();
    const confirmBtn = screen.getByRole('button', { name: /Delete$|Usuń$/i });
    fireEvent.click(confirmBtn);

    // Assert
    expect(onDeleteTaskMock).toHaveBeenCalledTimes(1);
    expect(onDeleteTaskMock).toHaveBeenCalledWith('t1');
  });

  it('should render child subtasks via SubtaskList when task has subtasks', () => {
    // Arrange
    const subTask = aTask({
      id: 'sub_1',
      projectId: 'p1',
      name: 'Nested Subtask',
      parentTaskId: 't1',
      completed: false,
    });
    const state = createMockState({
      tasks: [rootTask, subTask],
      projectTasks: [rootTask, subTask],
    });

    // Act
    const { container } = render(<TaskItem rootTask={rootTask} state={state} isCondensed={false} />);

    // Assert
    expect(screen.getByText('Nested Subtask')).toBeTruthy();
    expect(container.querySelector('#subtask-item-sub_1')).not.toBeNull();
  });

  it('should apply condensed layout classes when isCondensed is true', () => {
    // Arrange
    const state = createMockState();

    // Act
    const { container } = render(<TaskItem rootTask={rootTask} state={state} isCondensed={true} />);

    // Assert
    const headerWrapper = container.querySelector('.animate-fade-in');
    expect(headerWrapper).not.toBeNull();
    expect(headerWrapper?.className).toContain('flex-col');
  });
});

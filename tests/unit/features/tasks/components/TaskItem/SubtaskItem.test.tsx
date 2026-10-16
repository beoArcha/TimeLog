// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SubtaskItem } from '@features/tasks/components/TaskItem/SubtaskItem';

describe('Unit Tests: SubtaskItem', () => {
  const onToggleTaskCompleteMock = vi.fn();
  const onDeleteTaskMock = vi.fn();
  const onStartTimerMock = vi.fn();
  const setEditingIdMock = vi.fn();
  const setEditNameMock = vi.fn();

  const createMockProps = () => ({
    subTask: {
      id: 't2',
      projectId: 'p1',
      name: 'Subtask name',
      completed: false,
      createdAt: '2026-06-15T00:00:00Z',
      status: null,
      parentTaskId: 't1',
    },
    onToggleTaskComplete: onToggleTaskCompleteMock,
    onRenameTask: vi.fn(),
    onUpdateTask: vi.fn(),
    onDeleteTask: onDeleteTaskMock,
    onStartTimer: onStartTimerMock,
    setEditingId: setEditingIdMock,
    setEditName: setEditNameMock,
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('should render subtask item name and initial state', () => {
    // Arrange
    const props = createMockProps();

    // Act
    const { container } = render(<SubtaskItem {...props} />);

    // Assert
    expect(screen.getByText('Subtask name')).toBeTruthy();
    const checkbox = container.querySelector('#check-subtask-t2');
    expect(checkbox).not.toBeNull();
    expect(checkbox?.getAttribute('aria-checked')).toBe('false');
    const startBtn = container.querySelector('#start-subtask-btn-t2');
    expect(startBtn).not.toBeNull();
  });

  it('should trigger onToggleTaskComplete with subtask id when completion checkbox is clicked', () => {
    // Arrange
    const props = createMockProps();
    const { container } = render(<SubtaskItem {...props} />);

    // Act
    const checkbox = container.querySelector('#check-subtask-t2');
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);

    // Assert
    expect(onToggleTaskCompleteMock).toHaveBeenCalledTimes(1);
    expect(onToggleTaskCompleteMock).toHaveBeenCalledWith('t2');
  });

  it('should trigger onStartTimer with subtask id when start button is clicked', () => {
    // Arrange
    const props = createMockProps();
    const { container } = render(<SubtaskItem {...props} />);

    // Act
    const startBtn = container.querySelector('#start-subtask-btn-t2');
    expect(startBtn).not.toBeNull();
    fireEvent.click(startBtn!);

    // Assert
    expect(onStartTimerMock).toHaveBeenCalledTimes(1);
    expect(onStartTimerMock).toHaveBeenCalledWith('t2');
  });
});

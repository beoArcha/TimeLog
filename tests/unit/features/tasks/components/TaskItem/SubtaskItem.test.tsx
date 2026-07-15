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

  const mockProps = {
    subTask: { id: 't2', projectId: 'p1', name: 'Subtask name', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: 't1' },
    tasks: [],
    logs: [],
    nowIso: '2026-06-15T12:00:00Z',
    editingId: null,
    editName: '',
    theme: 'dark',
    locale: 'en' as const,
    customTranslations: {},
    th: {},
    onToggleTaskComplete: onToggleTaskCompleteMock,
    onRenameTask: vi.fn(),
    onUpdateTask: vi.fn(),
    onDeleteTask: onDeleteTaskMock,
    onStartTimer: onStartTimerMock,
    setEditingId: setEditingIdMock,
    setEditName: setEditNameMock,
  };

  afterEach(() => {
    cleanup();
  });

  it('should render subtask item name and trigger callbacks', () => {
    const { container } = render(<SubtaskItem {...mockProps} />);

    expect(screen.getByText(/Subtask name/i)).not.toBeNull();

    // Trigger toggle complete using the correct ID check-subtask-t2
    const checkbox = container.querySelector('#check-subtask-t2');
    expect(checkbox).not.toBeNull();
    fireEvent.click(checkbox!);
    expect(onToggleTaskCompleteMock).toHaveBeenCalledWith('t2');

    // Trigger start timer using the correct ID start-subtask-btn-t2
    const startBtn = container.querySelector('#start-subtask-btn-t2');
    expect(startBtn).not.toBeNull();
    fireEvent.click(startBtn!);
    expect(onStartTimerMock).toHaveBeenCalledWith('t2');
  });
});

// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskHeader } from '@features/tasks/components/TaskItem/TaskHeader';

describe('Unit Tests: TaskHeader', () => {
  const onToggleTaskCompleteMock = vi.fn();
  const setEditingIdMock = vi.fn();
  const setEditNameMock = vi.fn();

  const mockProps = {
    rootTask: { id: 't1', projectId: 'p1', name: 'Task Header Title', completed: false, createdAt: '2026-06-15T00:00:00Z', status: null, parentTaskId: null },
    isCurrentRunning: false,
    isChildRunning: false,
    runningSubtask: undefined,
    editingId: null,
    editName: '',
    theme: 'dark',
    locale: 'en' as const,
    customTranslations: {},
    th: {},
    onToggleTaskComplete: onToggleTaskCompleteMock,
    onRenameTask: vi.fn(),
    onUpdateTask: vi.fn(),
    onDeleteTask: vi.fn(),
    setEditingId: setEditingIdMock,
    setEditName: setEditNameMock,
  };

  it('should render task name and trigger toggle complete checkbox', () => {
    render(<TaskHeader {...mockProps} />);

    expect(screen.getByText(/Task Header Title/i)).not.toBeNull();

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(onToggleTaskCompleteMock).toHaveBeenCalledWith('t1');
  });
});

// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TaskActions } from '@features/tasks/components/TaskItem/TaskActions';

describe('Unit Tests: TaskActions', () => {
  const onDeleteTaskMock = vi.fn();
  const setEditingIdMock = vi.fn();
  const setEditNameMock = vi.fn();

  const mockProps = {
    taskId: 't1',
    taskName: 'Task OneName',
    locale: 'en' as const,
    customTranslations: {},
    deleteTitle: 'Delete task',
    pencilSize: 'w-3.5 h-3.5',
    trashSize: 'w-3.5 h-3.5',
    onDeleteTask: onDeleteTaskMock,
    setEditingId: setEditingIdMock,
    setEditName: setEditNameMock,
  };

  afterEach(() => {
    cleanup();
  });

  it('should trigger delete task click and edit name click', () => {
    render(<TaskActions {...mockProps} />);

    const editBtn = screen.getByRole('button', { name: /Edit name/i });
    fireEvent.click(editBtn);

    expect(setEditingIdMock).toHaveBeenCalledWith('t1');
    expect(setEditNameMock).toHaveBeenCalledWith('Task OneName');

    const deleteBtn = screen.getByRole('button', { name: /Delete task/i });
    fireEvent.click(deleteBtn);

    expect(onDeleteTaskMock).toHaveBeenCalledWith('t1');
  });
});

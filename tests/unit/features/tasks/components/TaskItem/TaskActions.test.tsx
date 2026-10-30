// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TaskActions } from '@features/tasks/components/TaskItem/TaskActions';

describe('Unit Tests: TaskActions', () => {
  const onDeleteTaskMock = vi.fn();
  const setEditingIdMock = vi.fn();
  const setEditNameMock = vi.fn();

  const baseProps = {
    taskId: 't1',
    taskName: 'Task OneName',
    deleteTitle: 'Delete task',
    pencilSize: 'w-3.5 h-3.5',
    trashSize: 'w-3.5 h-3.5',
    onDeleteTask: onDeleteTaskMock,
    setEditingId: setEditingIdMock,
    setEditName: setEditNameMock,
  };

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('triggers edit name handlers on edit button click', () => {
    render(<TaskActions {...baseProps} />);

    const editBtn = screen.getByRole('button', { name: /Edit/i });
    fireEvent.click(editBtn);

    expect(setEditingIdMock).toHaveBeenCalledWith('t1');
    expect(setEditNameMock).toHaveBeenCalledWith('Task OneName');
  });

  it('opens confirmation modal on delete click without calling onDeleteTask immediately', () => {
    render(<TaskActions {...baseProps} />);

    const deleteBtn = screen.getByRole('button', { name: /Delete task/i });
    fireEvent.click(deleteBtn);

    expect(onDeleteTaskMock).not.toHaveBeenCalled();
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).not.toBeNull();
    expect(screen.getByText('Task OneName')).not.toBeNull();
  });

  it('renders root task confirmation title and cascade warnings when counts > 0', () => {
    render(
      <TaskActions
        {...baseProps}
        isSubtask={false}
        subtasksCount={3}
        timeLogsCount={7}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Delete task/i }));

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).not.toBeNull();
    // Subtask count warning
    expect(screen.getByText(/3/)).not.toBeNull();
    // TimeLogs count warning
    expect(screen.getByText(/7/)).not.toBeNull();
  });

  it('renders subtask confirmation title and omits warnings when counts are 0', () => {
    render(
      <TaskActions
        {...baseProps}
        isSubtask={true}
        subtasksCount={0}
        timeLogsCount={0}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Delete task/i }));

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).not.toBeNull();
    expect(screen.queryByText(/podzadań|subtasks/i)).toBeNull();
    expect(screen.queryByText(/wpisów czasu|time logs/i)).toBeNull();
  });

  it('closes dialog on cancel button click without calling onDeleteTask', async () => {
    render(<TaskActions {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Delete task/i }));
    expect(screen.getByRole('alertdialog')).not.toBeNull();

    const cancelBtn = screen.getByRole('button', { name: /Cancel|Anuluj/i });
    fireEvent.click(cancelBtn);

    expect(onDeleteTaskMock).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });

  it('calls onDeleteTask on confirm click and closes dialog', async () => {
    onDeleteTaskMock.mockResolvedValueOnce(undefined);
    render(<TaskActions {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Delete task/i }));
    const confirmBtn = screen.getByRole('button', { name: /Delete$|Usuń$/i });
    fireEvent.click(confirmBtn);

    expect(onDeleteTaskMock).toHaveBeenCalledWith('t1');
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
  });
});

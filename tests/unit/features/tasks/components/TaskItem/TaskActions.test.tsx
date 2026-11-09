// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { TaskActions } from '@features/tasks/components/TaskItem/TaskActions';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { TimeLog } from '@bindings/TimeLog';
import { Task } from '@bindings/Task';

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

  it('keeps confirmation dialog open, renders role="alert" with error message, and allows retry when onDeleteTask fails', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    onDeleteTaskMock.mockRejectedValueOnce(new Error('Failed to delete'));
    render(<TaskActions {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /Delete task/i }));
    const confirmBtn = screen.getByRole('button', { name: /Delete$|Usuń$/i });
    fireEvent.click(confirmBtn);

    expect(onDeleteTaskMock).toHaveBeenCalledWith('t1');

    const alert = await screen.findByRole('alert');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toBe('Failed to delete');
    expect(screen.getByTestId('confirm-dialog-error')).not.toBeNull();

    await waitFor(() => {
      expect(screen.getByRole('alertdialog')).not.toBeNull();
      expect(confirmBtn.getAttribute('aria-busy')).not.toBe('true');
      expect(confirmBtn.hasAttribute('disabled')).toBe(false);
    });

    // Verify user can retry and dialog closes on successful deletion
    onDeleteTaskMock.mockResolvedValueOnce(undefined);
    fireEvent.click(confirmBtn);

    expect(onDeleteTaskMock).toHaveBeenCalledTimes(2);
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });

    consoleErrorSpy.mockRestore();
  });

  describe('Clock button conditional rendering & logs modal integration', () => {
    const mockLog: TimeLog = {
      id: 'log-1',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-11-09T08:00:00Z',
      endTime: '2026-11-09T09:30:00Z',
      note: 'Initial development',
    };

    it('does not render clock button when task has no time logs', () => {
      render(
        <MockProviders dataState={{ logs: [] }}>
          <TaskActions {...baseProps} timeLogsCount={0} />
        </MockProviders>
      );

      expect(screen.queryByTestId('clock-task-btn-t1')).toBeNull();
    });

    it('does not render clock button when matching logs are empty, even if timeLogsCount is greater than zero', () => {
      render(
        <MockProviders dataState={{ logs: [] }}>
          <TaskActions {...baseProps} timeLogsCount={3} />
        </MockProviders>
      );

      expect(screen.queryByTestId('clock-task-btn-t1')).toBeNull();
    });

    it('does not allow empty propLogs [] to mask context logs from TimerContext or DataContext', () => {
      render(
        <MockProviders dataState={{ logs: [mockLog] }}>
          <TaskActions {...baseProps} logs={[]} />
        </MockProviders>
      );

      expect(screen.getByTestId('clock-task-btn-t1')).not.toBeNull();
    });

    it('renders clock button when matching logs are provided in props', () => {
      render(
        <MockProviders dataState={{ logs: [] }}>
          <TaskActions {...baseProps} timeLogsCount={0} logs={[mockLog]} />
        </MockProviders>
      );

      expect(screen.getByTestId('clock-task-btn-t1')).not.toBeNull();
    });

    it('renders clock button for root task when subtasks have logs', () => {
      const subtaskLog: TimeLog = {
        id: 'log-sub-1',
        taskId: 'sub-1',
        projectId: 'p1',
        startTime: '2026-11-09T10:00:00Z',
        endTime: '2026-11-09T11:00:00Z',
        note: 'Subtask work',
      };

      const tasks: Task[] = [
        {
          id: 't1',
          name: 'Task OneName',
          projectId: 'p1',
          parentTaskId: undefined,
          status: 'Todo',
          completed: false,
          hourlyRate: undefined,
          createdAt: '2026-11-09T00:00:00Z',
        },
        {
          id: 'sub-1',
          name: 'Subtask 1',
          projectId: 'p1',
          parentTaskId: 't1',
          status: 'Todo',
          completed: false,
          hourlyRate: undefined,
          createdAt: '2026-11-09T00:00:00Z',
        },
      ];

      render(
        <MockProviders dataState={{ tasks, logs: [subtaskLog] }}>
          <TaskActions {...baseProps} isSubtask={false} timeLogsCount={0} />
        </MockProviders>
      );

      expect(screen.getByTestId('clock-task-btn-t1')).not.toBeNull();
    });

    it('displays formatted date for both root task logs and subtask logs, and includes subtask name badge', async () => {
      const subtaskLog: TimeLog = {
        id: 'log-sub-1',
        taskId: 'sub-1',
        projectId: 'p1',
        startTime: '2026-11-09T10:00:00Z',
        endTime: '2026-11-09T11:00:00Z',
        note: 'Subtask note',
      };

      const tasks: Task[] = [
        {
          id: 't1',
          name: 'Task OneName',
          projectId: 'p1',
          parentTaskId: undefined,
          status: 'Todo',
          completed: false,
          createdAt: '2026-11-09T00:00:00Z',
        },
        {
          id: 'sub-1',
          name: 'Subtask Alpha',
          projectId: 'p1',
          parentTaskId: 't1',
          status: 'Todo',
          completed: false,
          createdAt: '2026-11-09T00:00:00Z',
        },
      ];

      render(
        <MockProviders dataState={{ tasks, logs: [mockLog, subtaskLog] }}>
          <TaskActions {...baseProps} isSubtask={false} />
        </MockProviders>
      );

      fireEvent.click(screen.getByTestId('clock-task-btn-t1'));

      const rootItem = await screen.findByTestId('log-item-log-1');
      const subItem = await screen.findByTestId('log-item-log-sub-1');

      expect(rootItem).not.toBeNull();
      expect(subItem).not.toBeNull();

      expect(subItem.textContent).toContain('Subtask Alpha');
      expect(subItem.textContent).toMatch(/09|Nov|11/);
      expect(rootItem.textContent).toMatch(/09|Nov|11/);
    });

    it('calculates canonical duration for completed logs and active running logs', async () => {
      const completedLog: TimeLog = {
        id: 'log-comp',
        taskId: 't1',
        projectId: 'p1',
        startTime: '2026-11-09T08:00:00Z',
        endTime: '2026-11-09T08:30:00Z',
      };
      const activeLog: TimeLog = {
        id: 'log-act',
        taskId: 't1',
        projectId: 'p1',
        startTime: new Date(Date.now() - 65000).toISOString(),
        endTime: undefined,
      };

      render(
        <MockProviders dataState={{ logs: [completedLog, activeLog] }}>
          <TaskActions {...baseProps} />
        </MockProviders>
      );

      fireEvent.click(screen.getByTestId('clock-task-btn-t1'));

      const compItem = await screen.findByTestId('log-item-log-comp');
      const actItem = await screen.findByTestId('log-item-log-act');

      expect(compItem.textContent).toContain('00:30:00');
      expect(actItem.textContent).toContain('...');
      expect(actItem.textContent).toMatch(/00:01:0[0-9]|00:01:1[0-9]/);
    });

    it('opens logs popover and opens ReportLogEditModal with prefilled data upon selecting a log', async () => {
      const handleEditTimeLogMock = vi.fn().mockResolvedValue({ saved: true, synchronized: true });
      const refreshDataMock = vi.fn().mockResolvedValue(true);

      render(
        <MockProviders
          dataState={{
            logs: [mockLog],
            handleEditTimeLog: handleEditTimeLogMock,
            refreshData: refreshDataMock,
          }}
        >
          <TaskActions {...baseProps} logs={[mockLog]} />
        </MockProviders>
      );

      const clockBtn = screen.getByTestId('clock-task-btn-t1');
      expect(clockBtn).not.toBeNull();
      fireEvent.click(clockBtn);

      const logItemBtn = await screen.findByTestId('log-item-log-1');
      expect(logItemBtn).not.toBeNull();

      fireEvent.click(logItemBtn);

      const startInput = await screen.findByTestId('audit-edit-start-time');
      const endInput = screen.getByTestId('audit-edit-end-time');
      const noteInput = screen.getByTestId('audit-edit-note');

      expect((startInput as HTMLInputElement).value).toBe('2026-11-09T08:00:00Z');
      expect((endInput as HTMLInputElement).value).toBe('2026-11-09T09:30:00Z');
      expect((noteInput as HTMLInputElement).value).toBe('Initial development');

      // Test save flow
      const reasonInput = screen.getByTestId('audit-edit-reason');
      fireEvent.change(reasonInput, { target: { value: 'Fixing start time inaccuracy' } });

      const saveBtn = screen.getByTestId('audit-save-button');
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(handleEditTimeLogMock).toHaveBeenCalledWith(
          'log-1',
          't1',
          '2026-11-09T08:00:00Z',
          '2026-11-09T09:30:00Z',
          'Initial development',
          'Fixing start time inaccuracy'
        );
        expect(refreshDataMock).toHaveBeenCalled();
        expect(screen.queryByTestId('audit-edit-start-time')).toBeNull();
      });
    });

    it('refreshes data and closes modal after deleting a log in ReportLogEditModal via ConfirmDialog', async () => {
      const handleDeleteTimeLogMock = vi.fn().mockResolvedValue({ deleted: true, synchronized: true });
      const refreshDataMock = vi.fn().mockResolvedValue(true);

      render(
        <MockProviders
          dataState={{
            logs: [mockLog],
            handleDeleteTimeLog: handleDeleteTimeLogMock,
            refreshData: refreshDataMock,
          }}
        >
          <TaskActions {...baseProps} logs={[mockLog]} />
        </MockProviders>
      );

      fireEvent.click(screen.getByTestId('clock-task-btn-t1'));
      const logItemBtn = await screen.findByTestId('log-item-log-1');
      fireEvent.click(logItemBtn);

      const deleteBtn = await screen.findByTestId('audit-delete-button');
      fireEvent.click(deleteBtn);

      const confirmBtn = await screen.findByTestId('confirm-dialog-confirm-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(handleDeleteTimeLogMock).toHaveBeenCalledWith('log-1');
        expect(refreshDataMock).toHaveBeenCalled();
        expect(screen.queryByTestId('audit-delete-button')).toBeNull();
      });
    });

    it('does not report mutation failure if refreshData rejects in handleLogMutationSuccess', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const handleDeleteTimeLogMock = vi.fn().mockResolvedValue({ deleted: true, synchronized: true });
      const refreshDataMock = vi.fn().mockRejectedValue(new Error('Network error on refresh'));

      render(
        <MockProviders
          dataState={{
            logs: [mockLog],
            handleDeleteTimeLog: handleDeleteTimeLogMock,
            refreshData: refreshDataMock,
          }}
        >
          <TaskActions {...baseProps} logs={[mockLog]} />
        </MockProviders>
      );

      fireEvent.click(screen.getByTestId('clock-task-btn-t1'));
      const logItemBtn = await screen.findByTestId('log-item-log-1');
      fireEvent.click(logItemBtn);

      const deleteBtn = await screen.findByTestId('audit-delete-button');
      fireEvent.click(deleteBtn);

      const confirmBtn = await screen.findByTestId('confirm-dialog-confirm-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(handleDeleteTimeLogMock).toHaveBeenCalledWith('log-1');
        expect(refreshDataMock).toHaveBeenCalled();
        expect(screen.queryByTestId('audit-delete-button')).toBeNull();
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TaskActions] refreshData failed after mutation:'),
        expect.any(Error)
      );
      consoleWarnSpy.mockRestore();
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuditEdit } from '@features/reports/hooks/useAuditEdit';
import { TimeLog } from '@bindings/TimeLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import * as DataContextModule from '@common/hooks/DataContext';

describe('Unit Tests: useAuditEdit hook', () => {
  const sampleProjects: Project[] = [
    { id: 'p1', name: 'Project 1', color: 'indigo', createdAt: '2026-06-15T00:00:00Z' },
  ];

  const sampleTasks: Task[] = [
    { id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026-06-15' },
  ];

  const sampleLogs: TimeLog[] = [
    {
      id: 'l1',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
      note: 'Source note',
    },
    {
      id: 'l-active',
      taskId: 't1',
      projectId: 'p1',
      startTime: '2026-06-15T12:00:00Z',
      endTime: undefined,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Given initial render, When checking default state, Then editing and deleting logs are null', () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useAuditEdit({
        projects: sampleProjects,
        tasks: sampleTasks,
        logs: sampleLogs,
      })
    );

    // Assert
    expect(result.current.editingLog).toBeNull();
    expect(result.current.deletingLog).toBeNull();
    expect(result.current.activeEditingSourceLog).toBeNull();
  });

  it('Given a log, When openEdit is called, Then editingLog is set and activeEditingSourceLog is resolved', () => {
    // Arrange
    const { result } = renderHook(() =>
      useAuditEdit({
        projects: sampleProjects,
        tasks: sampleTasks,
        logs: sampleLogs,
      })
    );

    // Act
    act(() => {
      result.current.openEdit(sampleLogs[0]);
    });

    // Assert
    expect(result.current.editingLog).toEqual(sampleLogs[0]);
    expect(result.current.activeEditingSourceLog).toEqual(sampleLogs[0]);
    expect(result.current.editingTask?.name).toBe('Task 1');
    expect(result.current.editingProject?.name).toBe('Project 1');

    // Act closeEdit
    act(() => {
      result.current.closeEdit();
    });

    // Assert
    expect(result.current.editingLog).toBeNull();
    expect(result.current.activeEditingSourceLog).toBeNull();
  });

  it('Given an active log, When isLogActive is called, Then correctly identifies active state', () => {
    // Arrange
    const { result } = renderHook(() =>
      useAuditEdit({
        projects: sampleProjects,
        tasks: sampleTasks,
        logs: sampleLogs,
        activeTimerLogId: 'l-active',
      })
    );

    // Act & Assert
    expect(result.current.isLogActive(sampleLogs[0])).toBe(false);
    expect(result.current.isLogActive(sampleLogs[1])).toBe(true);
  });

  it('Given deletingLog, When handleConfirmDelete is called, Then calls handleDeleteTimeLog and onLogDeleted callback', async () => {
    // Arrange
    const handleDeleteTimeLogMock = vi.fn().mockResolvedValue(undefined);
    const onLogDeletedMock = vi.fn();
    vi.spyOn(DataContextModule, 'useDataSafe').mockReturnValue({
      handleDeleteTimeLog: handleDeleteTimeLogMock,
      logs: sampleLogs,
    } as unknown as ReturnType<typeof DataContextModule.useDataSafe>);

    const { result } = renderHook(() =>
      useAuditEdit({
        projects: sampleProjects,
        tasks: sampleTasks,
        logs: sampleLogs,
        onLogDeleted: onLogDeletedMock,
      })
    );

    // Act
    act(() => {
      result.current.openDelete(sampleLogs[0]);
    });
    expect(result.current.deletingLog).toEqual(sampleLogs[0]);

    await act(async () => {
      await result.current.handleConfirmDelete();
    });

    // Assert
    expect(handleDeleteTimeLogMock).toHaveBeenCalledWith('l1');
    expect(onLogDeletedMock).toHaveBeenCalledWith('l1');
    expect(result.current.deletingLog).toBeNull();
    expect(result.current.deleteError).toBeNull();
  });

  it('Given missing handleDeleteTimeLog, When handleConfirmDelete is called, Then does not trigger onLogDeleted and preserves deletingLog', async () => {
    // Arrange
    const onLogDeletedMock = vi.fn();
    vi.spyOn(DataContextModule, 'useDataSafe').mockReturnValue({
      logs: sampleLogs,
      refreshData: vi.fn(),
    } as unknown as ReturnType<typeof DataContextModule.useDataSafe>);

    const { result } = renderHook(() =>
      useAuditEdit({
        projects: sampleProjects,
        tasks: sampleTasks,
        logs: sampleLogs,
        onLogDeleted: onLogDeletedMock,
      })
    );

    // Act
    act(() => {
      result.current.openDelete(sampleLogs[0]);
    });

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.handleConfirmDelete();
      } catch (err) {
        caughtError = err;
      }
    });

    // Assert
    expect(caughtError).toBeInstanceOf(Error);
    expect((caughtError as Error).message).toContain('Deletion handler is not available');
    expect(onLogDeletedMock).not.toHaveBeenCalled();
    expect(result.current.deletingLog).toEqual(sampleLogs[0]);
    expect(result.current.deleteError).toContain('Deletion handler is not available');
  });

  it('Given failing handleDeleteTimeLog, When handleConfirmDelete is called, Then preserves deletingLog and sets deleteError', async () => {
    // Arrange
    const handleDeleteTimeLogMock = vi.fn().mockRejectedValue(new Error('Backend delete failure'));
    const onLogDeletedMock = vi.fn();
    vi.spyOn(DataContextModule, 'useDataSafe').mockReturnValue({
      handleDeleteTimeLog: handleDeleteTimeLogMock,
      logs: sampleLogs,
    } as unknown as ReturnType<typeof DataContextModule.useDataSafe>);

    const { result } = renderHook(() =>
      useAuditEdit({
        projects: sampleProjects,
        tasks: sampleTasks,
        logs: sampleLogs,
        onLogDeleted: onLogDeletedMock,
      })
    );

    // Act
    act(() => {
      result.current.openDelete(sampleLogs[0]);
    });

    let caughtError: unknown;
    await act(async () => {
      try {
        await result.current.handleConfirmDelete();
      } catch (err) {
        caughtError = err;
      }
    });

    // Assert
    expect(caughtError).toBeInstanceOf(Error);
    expect(onLogDeletedMock).not.toHaveBeenCalled();
    expect(result.current.deletingLog).toEqual(sampleLogs[0]);
    expect(result.current.deleteError).toBe('Backend delete failure');

    // Act closeDelete resets error
    act(() => {
      result.current.closeDelete();
    });
    expect(result.current.deletingLog).toBeNull();
    expect(result.current.deleteError).toBeNull();
  });
});

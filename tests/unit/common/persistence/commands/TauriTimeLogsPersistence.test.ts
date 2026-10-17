import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { TauriTimeLogsPersistence } from '@common/persistence/commands/TauriTimeLogsPersistence';
import { aTimeLog } from '@tests/shared/builders/entity-builders';
import { ErrorHandler } from '@common/exceptions';

describe('TauriTimeLogsPersistence', () => {
  let timeLogsPersistence: TauriTimeLogsPersistence;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    timeLogsPersistence = new TauriTimeLogsPersistence();
  });

  it('should invoke get_for_task command and return matching logs', async () => {
    // Arrange
    const log = aTimeLog({ id: 'log-1', taskId: 'task-1' });
    mockInvoke.mockResolvedValueOnce([log]);

    // Act
    const result = await timeLogsPersistence.getForTask('task-1');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_for_task', { taskId: 'task-1' });
    expect(result).toEqual([log]);
  });

  it('should invoke close_active_by_project command with timestamp and project id', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce(undefined);

    // Act
    await timeLogsPersistence.closeActiveByProject('2026-01-01T12:00:00Z', 'proj-1');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('close_active_by_project', {
      endTime: '2026-01-01T12:00:00Z',
      projectId: 'proj-1',
    });
  });

  it('should invoke close_all_active command with timestamp', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce(undefined);

    // Act
    await timeLogsPersistence.closeAllActive('2026-01-01T12:00:00Z');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('close_all_active', {
      endTime: '2026-01-01T12:00:00Z',
    });
  });

  it('should invoke insert command with log metadata', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce(undefined);

    // Act
    await timeLogsPersistence.insert('log-new', 'task-1', '2026-01-01T10:00:00Z');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('insert', {
      logId: 'log-new',
      taskId: 'task-1',
      startTime: '2026-01-01T10:00:00Z',
    });
  });

  it('should invoke query_active command and return active task ids', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce(['task-1', 'task-2']);

    // Act
    const result = await timeLogsPersistence.queryActive();

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('query_active');
    expect(result).toEqual(['task-1', 'task-2']);
  });

  it('should invoke get_all command and return all stored logs', async () => {
    // Arrange
    const logs = [aTimeLog({ id: 'log-1' }), aTimeLog({ id: 'log-2' })];
    mockInvoke.mockResolvedValueOnce(logs);

    // Act
    const result = await timeLogsPersistence.getAll();

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_all');
    expect(result).toEqual(logs);
  });

  it('should invoke delete_time_log command when deleting log by id', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce(undefined);

    // Act
    await timeLogsPersistence.delete('log-del');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('delete_time_log', { logId: 'log-del' });
  });

  it('should report exception and rethrow when delete_time_log fails', async () => {
    // Arrange
    const error = new Error('Tauri delete failed');
    mockInvoke.mockRejectedValueOnce(error);

    // Act & Assert
    await expect(timeLogsPersistence.delete('log-err')).rejects.toThrow('Tauri delete failed');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });
});

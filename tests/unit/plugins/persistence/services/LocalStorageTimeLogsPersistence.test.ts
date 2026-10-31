import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageTimeLogsPersistence } from '@plugins/persistence/services/LocalStorageTimeLogsPersistence';
import { ILocalStorageStateStore } from '@plugins/persistence/services/LocalStorageStateStore';
import { aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { PersistenceException } from '@common/exceptions';

describe('LocalStorageTimeLogsPersistence', () => {
  let storeMock: ILocalStorageStateStore;
  let timeLogsPersistence: LocalStorageTimeLogsPersistence;

  beforeEach(() => {
    vi.clearAllMocks();
    storeMock = {
      load: vi.fn(),
      save: vi.fn().mockImplementation(async (s) => s),
      reset: vi.fn(),
      getStateOrDefault: vi.fn().mockResolvedValue({
        projects: [],
        tasks: [],
        logs: [],
        activeLog: null,
      }),
      runExclusive: vi.fn().mockImplementation((fn: () => unknown) => fn()),
    };
    timeLogsPersistence = new LocalStorageTimeLogsPersistence(storeMock);
  });

  it('should return logs for task when getForTask is called', async () => {
    // Arrange
    const log1 = aTimeLog({ id: 'l1', taskId: 't1' });
    const log2 = aTimeLog({ id: 'l2', taskId: 't2' });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [],
      logs: [log1, log2],
      activeLog: null,
    });

    // Act
    const result = await timeLogsPersistence.getForTask('t1');

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('l1');
  });

  it('should close active logs matching project when closeActiveByProject is called', async () => {
    // Arrange
    const task = aTask({ id: 't1', projectId: 'p1' });
    const activeLog = aTimeLog({ id: 'l1', taskId: 't1', endTime: undefined });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [task],
      logs: [activeLog],
      activeLog,
    });

    // Act
    await timeLogsPersistence.closeActiveByProject('2026-06-15T15:00:00Z', 'p1');

    // Assert
    expect(storeMock.save).toHaveBeenCalledTimes(1);
    const savedState = vi.mocked(storeMock.save).mock.calls[0][0];
    expect(savedState.logs[0].endTime).toBe('2026-06-15T15:00:00Z');
    expect(savedState.activeLog).toBeNull();
  });

  it('should return active task ids when queryActive is called', async () => {
    // Arrange
    const log1 = aTimeLog({ id: 'l1', taskId: 't1', endTime: undefined });
    const log2 = aTimeLog({ id: 'l2', taskId: 't2', endTime: '2026-06-15T14:00:00Z' });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [],
      logs: [log1, log2],
      activeLog: log1,
    });

    // Act
    const activeTaskIds = await timeLogsPersistence.queryActive();

    // Assert
    expect(activeTaskIds).toEqual(['t1']);
  });

  it('should return all logs when getAll is called', async () => {
    // Arrange
    const log1 = aTimeLog({ id: 'l1' });
    const log2 = aTimeLog({ id: 'l2' });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [],
      logs: [log1, log2],
      activeLog: null,
    });

    // Act
    const allLogs = await timeLogsPersistence.getAll();

    // Assert
    expect(allLogs).toHaveLength(2);
  });

  it('should delete existing time log and clear activeLog when delete is called', async () => {
    // Arrange
    const log = aTimeLog({ id: 'log-1', taskId: 't1', endTime: undefined });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [],
      logs: [log],
      activeLog: log,
    });

    // Act
    await timeLogsPersistence.delete('log-1');

    // Assert
    expect(storeMock.save).toHaveBeenCalledTimes(1);
    const savedState = vi.mocked(storeMock.save).mock.calls[0][0];
    expect(savedState.logs).toHaveLength(0);
    expect(savedState.activeLog).toBeNull();
  });

  it('should throw PersistenceException when delete is called for non-existent log', async () => {
    // Arrange
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Act
    const action = () => timeLogsPersistence.delete('missing-log');

    // Assert
    await expect(action).rejects.toThrow(PersistenceException);
  });
});

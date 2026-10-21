import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserTimerEngine } from '@plugins/engine/services/BrowserTimerEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';

describe('BrowserTimerEngine', () => {
  let routerMock: PersistenceRouter;
  let engine: BrowserTimerEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    routerMock = {
      tasks: {
        getProjectId: vi.fn().mockResolvedValue('project-10'),
      },
      timeLogs: {
        closeActiveByProject: vi.fn().mockResolvedValue(undefined),
        closeAllActive: vi.fn().mockResolvedValue(undefined),
        insert: vi.fn().mockResolvedValue(undefined),
        queryActive: vi.fn().mockResolvedValue(['log-active-1']),
      },
    } as unknown as PersistenceRouter;

    engine = new BrowserTimerEngine(routerMock);
  });

  it('should close active project logs and insert new log when startTimer is called', async () => {
    // Act
    await engine.startTimer('task-99');

    // Assert
    expect(routerMock.tasks.getProjectId).toHaveBeenCalledWith('task-99');
    expect(routerMock.timeLogs.closeActiveByProject).toHaveBeenCalledTimes(1);
    expect(routerMock.timeLogs.insert).toHaveBeenCalledTimes(1);
  });

  it('should close project logs when stopTimer is called with specific project', async () => {
    // Act
    await engine.stopTimer('project-10');

    // Assert
    expect(routerMock.timeLogs.closeActiveByProject).toHaveBeenCalledTimes(1);
    expect(routerMock.timeLogs.closeAllActive).not.toHaveBeenCalled();
  });

  it('should close all active logs when stopTimer is called without project', async () => {
    // Act
    await engine.stopTimer();

    // Assert
    expect(routerMock.timeLogs.closeAllActive).toHaveBeenCalledTimes(1);
  });

  it('should query active logs from persistence when getActiveLogs is called', async () => {
    // Act
    const result = await engine.getActiveLogs();

    // Assert
    expect(result).toEqual(['log-active-1']);
    expect(routerMock.timeLogs.queryActive).toHaveBeenCalledTimes(1);
  });
});

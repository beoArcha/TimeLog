import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserTimeLogsEngine } from '@plugins/engine/services/BrowserTimeLogsEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { aTask, aTimeLog } from '../../../../shared/builders/entity-builders';

describe('BrowserTimeLogsEngine', () => {
  let routerMock: PersistenceRouter;
  let engine: BrowserTimeLogsEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    routerMock = {
      core: {
        load: vi.fn(),
        overrideState: vi.fn().mockResolvedValue({}),
      },
    } as unknown as PersistenceRouter;
    engine = new BrowserTimeLogsEngine(routerMock);
  });

  it('should throw when database state is not initialized', async () => {
    // Arrange
    vi.mocked(routerMock.core.load).mockResolvedValueOnce(null);

    // Act & Assert
    await expect(
      engine.editTimeLog('l1', 't1', '2026-06-15T10:00:00Z', null, null, null)
    ).rejects.toThrow('Database state not initialized');
  });

  it('should throw when log is not found', async () => {
    // Arrange
    vi.mocked(routerMock.core.load).mockResolvedValueOnce({
      projects: [],
      tasks: [aTask({ id: 't1' })],
      logs: [],
      activeLog: null,
    });

    // Act & Assert
    await expect(
      engine.editTimeLog('non-existent', 't1', '2026-06-15T10:00:00Z', null, null, null)
    ).rejects.toThrow('not found');
  });

  it('should update log fields and append history entry', async () => {
    // Arrange
    const originalLog = aTimeLog({
      id: 'l1',
      taskId: 't1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
      note: 'Old note',
      editHistory: null,
    });

    vi.mocked(routerMock.core.load).mockResolvedValueOnce({
      projects: [],
      tasks: [aTask({ id: 't1' })],
      logs: [originalLog],
      activeLog: null,
    });

    // Act
    await engine.editTimeLog(
      'l1',
      't1',
      '2026-06-15T10:30:00Z',
      '2026-06-15T11:30:00Z',
      'New note',
      'Adjusted time'
    );

    // Assert
    expect(routerMock.core.overrideState).toHaveBeenCalledTimes(1);
    const savedState = vi.mocked(routerMock.core.overrideState).mock.calls[0][0];
    const updated = savedState.logs?.find((l) => l.id === 'l1');
    expect(updated?.startTime).toBe('2026-06-15T10:30:00Z');
    expect(updated?.note).toBe('New note');
    expect(updated?.editHistory).toHaveLength(1);
    expect(updated?.editHistory?.[0].reason).toBe('Adjusted time');
    expect(updated?.editHistory?.[0].prevStartTime).toBe('2026-06-15T10:00:00Z');
  });
});

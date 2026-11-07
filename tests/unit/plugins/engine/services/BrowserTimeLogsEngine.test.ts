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
    expect(updated?.editHistory?.[0].auditSource).toBe('GUI Edit');
    expect(updated?.editHistory?.[0].prevStartTime).toBe('2026-06-15T10:00:00Z');
  });

  it('should throw validation exception when reason is missing or empty', async () => {
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

    // Act & Assert - null reason
    await expect(
      engine.editTimeLog('l1', 't1', '2026-06-15T10:00:00Z', '2026-06-15T11:00:00Z', null, null)
    ).rejects.toThrow('Audit reason is required for manual edits');

    // Act & Assert - whitespace reason
    vi.mocked(routerMock.core.load).mockResolvedValueOnce({
      projects: [],
      tasks: [aTask({ id: 't1' })],
      logs: [originalLog],
      activeLog: null,
    });

    await expect(
      engine.editTimeLog('l1', 't1', '2026-06-15T10:00:00Z', '2026-06-15T11:00:00Z', null, '   ')
    ).rejects.toThrow('Audit reason is required for manual edits');
  });

  it('should require reason for CliEdit and persist canonical auditSource', async () => {
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

    // Act & Assert - CliEdit without reason must throw
    await expect(
      engine.editTimeLog(
        'l1',
        't1',
        '2026-06-15T10:00:00Z',
        '2026-06-15T11:30:00Z',
        'CLI note',
        null,
        'CliEdit'
      )
    ).rejects.toThrow('Audit reason is required for manual edits');

    // Act & Assert - CliEdit with whitespace-only reason must throw
    vi.mocked(routerMock.core.load).mockResolvedValueOnce({
      projects: [],
      tasks: [aTask({ id: 't1' })],
      logs: [originalLog],
      activeLog: null,
    });

    await expect(
      engine.editTimeLog(
        'l1',
        't1',
        '2026-06-15T10:00:00Z',
        '2026-06-15T11:30:00Z',
        'CLI note',
        '   ',
        'CliEdit'
      )
    ).rejects.toThrow('Audit reason is required for manual edits');

    // Act - CliEdit with valid reason must succeed
    vi.mocked(routerMock.core.load).mockResolvedValueOnce({
      projects: [],
      tasks: [aTask({ id: 't1' })],
      logs: [originalLog],
      activeLog: null,
    });

    await engine.editTimeLog(
      'l1',
      't1',
      '2026-06-15T10:00:00Z',
      '2026-06-15T11:30:00Z',
      'CLI note',
      '  CLI command update  ',
      'CliEdit'
    );

    const savedState = vi.mocked(routerMock.core.overrideState).mock.calls[0][0];
    const updated = savedState.logs?.find((l) => l.id === 'l1');
    expect(updated?.editHistory).toHaveLength(1);
    expect(updated?.editHistory?.[0].auditSource).toBe('CLI Edit');
    expect(updated?.editHistory?.[0].reason).toBe('CLI command update');
  });

  it('should allow SystemPatch without a reason and trim reason when provided', async () => {
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

    // Act - SystemPatch without reason succeeds
    await engine.editTimeLog(
      'l1',
      't1',
      '2026-06-15T10:00:00Z',
      '2026-06-15T11:30:00Z',
      'Patch note',
      null,
      'SystemPatch'
    );

    const savedState = vi.mocked(routerMock.core.overrideState).mock.calls[0][0];
    const updated = savedState.logs?.find((l) => l.id === 'l1');
    expect(updated?.editHistory).toHaveLength(1);
    expect(updated?.editHistory?.[0].auditSource).toBe('System Patch');
    expect(updated?.editHistory?.[0].reason).toBeUndefined();

    // Act - SystemPatch with trimmed reason
    vi.mocked(routerMock.core.load).mockResolvedValueOnce({
      projects: [],
      tasks: [aTask({ id: 't1' })],
      logs: [originalLog],
      activeLog: null,
    });

    await engine.editTimeLog(
      'l1',
      't1',
      '2026-06-15T10:00:00Z',
      '2026-06-15T11:30:00Z',
      'Patch note 2',
      '  Auto repair patch  ',
      'System Patch'
    );

    const savedState2 = vi.mocked(routerMock.core.overrideState).mock.calls[1][0];
    const updated2 = savedState2.logs?.find((l) => l.id === 'l1');
    expect(updated2?.editHistory?.[0].auditSource).toBe('System Patch');
    expect(updated2?.editHistory?.[0].reason).toBe('Auto repair patch');
  });

  it('should require reason for ManualAdjustment and persist canonical auditSource', async () => {
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

    // Act & Assert - missing reason for ManualAdjustment
    await expect(
      engine.editTimeLog('l1', 't1', '2026-06-15T10:00:00Z', '2026-06-15T11:00:00Z', null, null, 'ManualAdjustment')
    ).rejects.toThrow('Audit reason is required for manual edits');

    // Act & Assert - valid ManualAdjustment
    vi.mocked(routerMock.core.load).mockResolvedValueOnce({
      projects: [],
      tasks: [aTask({ id: 't1' })],
      logs: [originalLog],
      activeLog: null,
    });

    await engine.editTimeLog(
      'l1',
      't1',
      '2026-06-15T10:00:00Z',
      '2026-06-15T11:00:00Z',
      null,
      '  Manual fix  ',
      'ManualAdjustment'
    );

    const savedState = vi.mocked(routerMock.core.overrideState).mock.calls[0][0];
    const updated = savedState.logs?.find((l) => l.id === 'l1');
    expect(updated?.editHistory?.[0].auditSource).toBe('Manual Adjustment');
    expect(updated?.editHistory?.[0].reason).toBe('Manual fix');
  });

  it('should reject unknown audit source with validation error', async () => {
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

    // Act & Assert
    await expect(
      engine.editTimeLog(
        'l1',
        't1',
        '2026-06-15T10:00:00Z',
        '2026-06-15T11:00:00Z',
        null,
        'Valid reason',
        'UnknownSource'
      )
    ).rejects.toThrow('Invalid audit source: UnknownSource');
  });
});

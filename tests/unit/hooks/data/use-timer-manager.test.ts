import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTimerManager } from '@common/hooks/data/useTimerManager';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EngineRouter } from '@common/engine/EngineRouter';
import { createMockRepositoryState, createMockActionRunner } from './test-doubles';

describe('Unit Tests: useTimerManager Hook', () => {
  const router = PersistenceRouter.getInstance();
  const engine = EngineRouter.getInstance();

  const mockLog = { id: 'log1', taskId: 't1', projectId: 'p1', startTime: '2026-01-01T10:00:00Z', endTime: null, note: null, editHistory: null };

  const mockRepositoryState = createMockRepositoryState({
    logs: [mockLog],
    activeLog: mockLog,
  });

  const mockActionRunner = createMockActionRunner();

  const pushToApi = vi.fn();
  const refreshComputedMetrics = vi.fn().mockResolvedValue(null);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start timer, reload state, refresh metrics and emit API start event', async () => {
    const startSpy = vi.spyOn(engine.timer, 'startTimer').mockResolvedValue();
    const nextLogs = [
      { id: 'log2', taskId: 't2', projectId: 'p1', startTime: '2026-01-01T11:00:00Z', endTime: null, note: null, editHistory: null },
    ];
    vi.spyOn(router.core, 'load').mockResolvedValue({
      projects: [],
      tasks: [],
      logs: nextLogs,
      activeLog: nextLogs[0],
    });

    const { result } = renderHook(() =>
      useTimerManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        pushToApi,
        refreshComputedMetrics,
      })
    );

    await act(async () => {
      await result.current.handleStartTimer('t2');
    });

    expect(startSpy).toHaveBeenCalledWith('t2');
    expect(mockRepositoryState.setLogsState).toHaveBeenCalledWith(nextLogs);
    expect(mockRepositoryState.setActiveLogState).toHaveBeenCalledWith(nextLogs[0]);
    expect(pushToApi).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'START' }),
      expect.stringContaining('Starting log2')
    );
  });

  it('should stop timer and notify termination to pushToApi', async () => {
    const stopSpy = vi.spyOn(engine.timer, 'stopTimer').mockResolvedValue();
    const stoppedLogs = [
      { id: 'log1', taskId: 't1', projectId: 'p1', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T11:00:00Z', note: null, editHistory: null },
    ];
    vi.spyOn(router.core, 'load').mockResolvedValue({
      projects: [],
      tasks: [],
      logs: stoppedLogs,
      activeLog: null,
    });

    const { result } = renderHook(() =>
      useTimerManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        pushToApi,
        refreshComputedMetrics,
      })
    );

    await act(async () => {
      await result.current.handleStopTimer();
    });

    expect(stopSpy).toHaveBeenCalledWith(undefined);
    expect(pushToApi).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'TERMINATE' }),
      expect.stringContaining('Terminating log1')
    );
  });

  it('should edit time log through actionRunner and synchronize repository state', async () => {
    const editSpy = vi.spyOn(engine.timeLogs, 'editTimeLog').mockResolvedValue();
    const nextLogs = [
      { id: 'log1', taskId: 't1', projectId: 'p1', startTime: '2026-01-01T10:00:00Z', endTime: '2026-01-01T11:00:00Z', note: 'Note', editHistory: null },
    ];
    vi.spyOn(router.core, 'load').mockResolvedValue({
      projects: [],
      tasks: [],
      logs: nextLogs,
      activeLog: null,
      activeLogs: [],
    });

    const { result } = renderHook(() =>
      useTimerManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        pushToApi,
        refreshComputedMetrics,
      })
    );

    let editResult: { saved: boolean; synchronized: boolean } | undefined;
    await act(async () => {
      editResult = await result.current.handleEditTimeLog(
        'log1', 't1', '2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', 'Note', null
      );
    });

    expect(editSpy).toHaveBeenCalledWith('log1', 't1', '2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', 'Note', null);
    expect(mockActionRunner.runAction).toHaveBeenNthCalledWith(
      1,
      'Failed to edit time log',
      expect.any(Function),
      expect.objectContaining({ errorCode: 'ERR_REPOSITORY_EDIT_TIME_LOG', rethrow: true })
    );
    expect(mockActionRunner.runAction).toHaveBeenNthCalledWith(
      2,
      'Failed to synchronize time log after edit',
      expect.any(Function),
      expect.objectContaining({ errorCode: 'ERR_REPOSITORY_SYNC_TIME_LOG', rethrow: false })
    );
    expect(mockRepositoryState.setLogsState).toHaveBeenCalledWith(nextLogs);
    expect(mockRepositoryState.setActiveLogState).toHaveBeenCalledWith(null);
    expect(mockRepositoryState.setActiveLogsState).toHaveBeenCalledWith([]);
    expect(refreshComputedMetrics).toHaveBeenCalled();
    expect(editResult).toEqual({ saved: true, synchronized: true });
  });

  it('should report a committed edit when repository synchronization fails', async () => {
    const editSpy = vi.spyOn(engine.timeLogs, 'editTimeLog').mockResolvedValue();
    vi.spyOn(router.core, 'load').mockRejectedValue(new Error('Repository reload failed'));

    const runActionMock = vi.fn()
      .mockImplementationOnce(async (_message: string, action: () => Promise<unknown>) => action())
      .mockImplementationOnce(async (_message: string, action: () => Promise<unknown>) => {
        try {
          return await action();
        } catch {
          return undefined;
        }
      });
    const actionRunner = createMockActionRunner({
      runAction: runActionMock as unknown as typeof mockActionRunner.runAction,
    });

    const { result } = renderHook(() =>
      useTimerManager({
        repositoryState: mockRepositoryState,
        actionRunner,
        pushToApi,
        refreshComputedMetrics,
      })
    );

    let editResult: { saved: boolean; synchronized: boolean } | undefined;
    await act(async () => {
      editResult = await result.current.handleEditTimeLog(
        'log1', 't1', '2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', 'Note', null
      );
    });

    expect(editSpy).toHaveBeenCalledTimes(1);
    expect(runActionMock).toHaveBeenCalledTimes(2);
    expect(editResult).toEqual({ saved: true, synchronized: false });
    expect(refreshComputedMetrics).not.toHaveBeenCalled();
  });

  it('should delete time log via router, reload state, and pass rethrow: true to actionRunner', async () => {
    const deleteSpy = vi.spyOn(router.timeLogs, 'delete').mockResolvedValue();
    vi.spyOn(router.core, 'load').mockResolvedValue({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    const { result } = renderHook(() =>
      useTimerManager({
        repositoryState: mockRepositoryState,
        actionRunner: mockActionRunner,
        pushToApi,
        refreshComputedMetrics,
      })
    );

    await act(async () => {
      await result.current.handleDeleteTimeLog('log1');
    });

    expect(deleteSpy).toHaveBeenCalledWith('log1');
    expect(mockActionRunner.runAction).toHaveBeenCalledWith(
      'Failed to delete time log',
      expect.any(Function),
      expect.objectContaining({ rethrow: true, errorCode: 'ERR_REPOSITORY_DELETE_TIME_LOG' })
    );
    expect(mockRepositoryState.setLogsState).toHaveBeenCalledWith([]);
    expect(mockRepositoryState.setActiveLogState).toHaveBeenCalledWith(null);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });
});

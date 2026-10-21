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

  it('should edit time log via engine and reload repository state', async () => {
    const editSpy = vi.spyOn(engine.timeLogs, 'editTimeLog').mockResolvedValue();
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
      await result.current.handleEditTimeLog('log1', 't1', '2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', 'Note', null);
    });

    expect(editSpy).toHaveBeenCalledWith('log1', 't1', '2026-01-01T10:00:00Z', '2026-01-01T11:00:00Z', 'Note', null);
    expect(refreshComputedMetrics).toHaveBeenCalled();
  });
});

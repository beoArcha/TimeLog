import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMetricsManager } from '@common/hooks/data/useMetricsManager';
import { EngineRouter } from '@common/engine/EngineRouter';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';

describe('Unit Tests: useMetricsManager Hook', () => {
  const engine = EngineRouter.getInstance();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null computed metrics', () => {
    const { result } = renderHook(() => useMetricsManager());
    expect(result.current.computedMetrics).toBeNull();
  });

  it('should fetch and update computed metrics', async () => {
    const mockMetrics: EngineComputedMetrics = {
      projects: {},
      tasks: {},
      snapshotNowIso: '2026-10-15T12:00:00Z',
    };
    vi.spyOn(engine, 'getComputedMetrics').mockResolvedValue(mockMetrics);

    const { result } = renderHook(() => useMetricsManager());

    await act(async () => {
      const returned = await result.current.fetchComputedMetrics();
      expect(returned).toEqual(mockMetrics);
    });

    expect(result.current.computedMetrics).toEqual(mockMetrics);
  });

  it('should preserve previous reference if tasks, projects, and snapshotNowIso are equal', async () => {
    const mockMetrics: EngineComputedMetrics = {
      projects: { p1: { projectId: 'p1', totalElapsedSeconds: 100, todayElapsedSeconds: 50, thisWeekElapsedSeconds: 100, activeTaskCount: 1, completedTaskCount: 0, isRunning: false } },
      tasks: { t1: { taskId: 't1', elapsedSeconds: 100, selfElapsedSeconds: 100, isRunning: false, hasRunningChild: false } },
      snapshotNowIso: '2026-10-15T12:00:00Z',
    };
    vi.spyOn(engine, 'getComputedMetrics').mockResolvedValue(mockMetrics);

    const { result } = renderHook(() => useMetricsManager());

    await act(async () => {
      await result.current.fetchComputedMetrics();
    });

    const firstRef = result.current.computedMetrics;

    const identicalMetrics: EngineComputedMetrics = {
      projects: { p1: { projectId: 'p1', totalElapsedSeconds: 100, todayElapsedSeconds: 50, thisWeekElapsedSeconds: 100, activeTaskCount: 1, completedTaskCount: 0, isRunning: false } },
      tasks: { t1: { taskId: 't1', elapsedSeconds: 100, selfElapsedSeconds: 100, isRunning: false, hasRunningChild: false } },
      snapshotNowIso: '2026-10-15T12:00:00Z',
    };
    vi.spyOn(engine, 'getComputedMetrics').mockResolvedValue(identicalMetrics);

    await act(async () => {
      await result.current.fetchComputedMetrics();
    });

    expect(result.current.computedMetrics).toBe(firstRef);
  });

  it('should return null and not throw if engine fails to fetch metrics', async () => {
    vi.spyOn(engine, 'getComputedMetrics').mockRejectedValue(new Error('Engine unavailable'));

    const { result } = renderHook(() => useMetricsManager());

    await act(async () => {
      const res = await result.current.fetchComputedMetrics();
      expect(res).toBeNull();
    });

    expect(result.current.computedMetrics).toBeNull();
  });
});

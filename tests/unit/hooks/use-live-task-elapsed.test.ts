import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLiveTaskElapsed, useLiveProjectElapsed } from '@common/hooks/useLiveTaskElapsed';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { TimeLog } from '@bindings/TimeLog';

describe('Unit Tests: useLiveTaskElapsed & useLiveProjectElapsed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const baseMetrics: EngineComputedMetrics = {
    snapshotNowIso: '2026-06-15T12:00:00.000Z',
    tasks: {
      'task-inactive': {
        taskId: 'task-inactive',
        elapsedSeconds: 120,
        selfElapsedSeconds: 120,
        isRunning: false,
        hasRunningChild: false,
      },
      'task-active': {
        taskId: 'task-active',
        elapsedSeconds: 300,
        selfElapsedSeconds: 300,
        isRunning: true,
        hasRunningChild: false,
      },
    },
    projects: {
      'proj-1': {
        projectId: 'proj-1',
        totalElapsedSeconds: 600,
        todayElapsedSeconds: 600,
        thisWeekElapsedSeconds: 600,
        isRunning: true,
        activeTaskCount: 1,
        completedTaskCount: 0,
      },
      'proj-inactive': {
        projectId: 'proj-inactive',
        totalElapsedSeconds: 50,
        todayElapsedSeconds: 50,
        thisWeekElapsedSeconds: 50,
        isRunning: false,
        activeTaskCount: 0,
        completedTaskCount: 1,
      },
    },
  };

  it('Given inactive task, Then it should return static elapsed without ticking', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    const { result } = renderHook(() =>
      useLiveTaskElapsed('task-inactive', { metrics: baseMetrics })
    );

    expect(result.current.elapsedSeconds).toBe(120);
    expect(result.current.formattedElapsed).toBe('00:02:00');
    expect(result.current.isRunning).toBe(false);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.elapsedSeconds).toBe(120);
  });

  it('Given active task, Then it should increment live elapsed every second', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    const activeLog: TimeLog = {
      id: 'log-1',
      taskId: 'task-active',
      projectId: 'proj-1',
      startTime: '2026-06-15T11:55:00.000Z',
    };

    const { result } = renderHook(() =>
      useLiveTaskElapsed('task-active', { metrics: baseMetrics, activeLog })
    );

    expect(result.current.isRunning).toBe(true);
    expect(result.current.elapsedSeconds).toBe(300);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.elapsedSeconds).toBe(303);
    expect(result.current.formattedElapsed).toBe('00:05:03');
  });

  it('Given custom refreshIntervalMs, Then it should support higher frequency ticking', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    const activeLog: TimeLog = {
      id: 'log-1',
      taskId: 'task-active',
      projectId: 'proj-1',
      startTime: '2026-06-15T11:55:00.000Z',
    };

    const { result } = renderHook(() =>
      useLiveTaskElapsed('task-active', {
        metrics: baseMetrics,
        activeLog,
        refreshIntervalMs: 100,
      })
    );

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(result.current.elapsedSeconds).toBe(301);
  });

  it('Given useLiveProjectElapsed for active and inactive projects, Then it should compute live duration correctly', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    const activeLog: TimeLog = {
      id: 'log-1',
      taskId: 'task-active',
      projectId: 'proj-1',
      startTime: '2026-06-15T11:50:00.000Z',
    };

    const { result: activeResult } = renderHook(() =>
      useLiveProjectElapsed('proj-1', { metrics: baseMetrics, activeLog })
    );
    const { result: inactiveResult } = renderHook(() =>
      useLiveProjectElapsed('proj-inactive', { metrics: baseMetrics })
    );

    expect(activeResult.current.isRunning).toBe(true);
    expect(activeResult.current.elapsedSeconds).toBe(600);
    expect(inactiveResult.current.isRunning).toBe(false);
    expect(inactiveResult.current.elapsedSeconds).toBe(50);

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(activeResult.current.elapsedSeconds).toBe(610);
    expect(inactiveResult.current.elapsedSeconds).toBe(50);
  });
});

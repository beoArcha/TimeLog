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
      'task-parent-with-child': {
        taskId: 'task-parent-with-child',
        elapsedSeconds: 500,
        selfElapsedSeconds: 200,
        isRunning: false,
        hasRunningChild: true,
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

  it('Given null metrics during initialization, Then it should return safe 0 for inactive tasks without errors', () => {
    const { result } = renderHook(() =>
      useLiveTaskElapsed('task-uninitialized', { metrics: null })
    );

    expect(result.current.isRunning).toBe(false);
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.formattedElapsed).toBe('00:00:00');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.elapsedSeconds).toBe(0);
  });

  it('Given null metrics but active log during initialization, Then it should tick live elapsed from activeLog start time', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    const activeLog: TimeLog = {
      id: 'log-transitional',
      taskId: 'task-transitional',
      projectId: 'proj-1',
      startTime: '2026-06-15T11:59:50.000Z', // 10s elapsed
    };

    const { result } = renderHook(() =>
      useLiveTaskElapsed('task-transitional', { metrics: null, activeLog })
    );

    expect(result.current.isRunning).toBe(true);
    expect(result.current.elapsedSeconds).toBe(10);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.elapsedSeconds).toBe(15);
  });

  it('Given changing taskId, Then it should reset live extra seconds cleanly', () => {
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));
    const activeLog1: TimeLog = {
      id: 'log-1',
      taskId: 'task-active',
      projectId: 'proj-1',
      startTime: '2026-06-15T11:55:00.000Z',
    };

    let currentTaskId = 'task-active';
    let currentLog: TimeLog | null = activeLog1;

    const { result, rerender } = renderHook(() =>
      useLiveTaskElapsed(currentTaskId, { metrics: baseMetrics, activeLog: currentLog })
    );

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.elapsedSeconds).toBe(305);

    currentTaskId = 'task-inactive';
    currentLog = null;
    rerender();

    expect(result.current.isRunning).toBe(false);
    expect(result.current.elapsedSeconds).toBe(120);
  });

  it('Given parent task with running child and includeChildren true, Then it should tick live', () => {
    // Given
    vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'));

    // When
    const { result } = renderHook(() =>
      useLiveTaskElapsed('task-parent-with-child', {
        metrics: baseMetrics,
        includeChildren: true,
      })
    );

    // Then
    expect(result.current.isRunning).toBe(true);
    expect(result.current.elapsedSeconds).toBe(500);

    // When
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Then
    expect(result.current.elapsedSeconds).toBe(503);
  });
});

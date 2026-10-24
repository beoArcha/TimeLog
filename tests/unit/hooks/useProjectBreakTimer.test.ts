import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useProjectBreakTimer } from '@common/hooks/useProjectBreakTimer';

describe('useProjectBreakTimer', () => {
  const onStartTimer = vi.fn();
  const onStopTimer = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-22T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with inactive break state when no persisted break exists', () => {
    // Arrange & Act
    const { result } = renderHook(() =>
      useProjectBreakTimer({ onStartTimer, onStopTimer })
    );

    // Assert
    expect(result.current.isBreakActive).toBe(false);
    expect(result.current.breakState).toBeNull();
    expect(result.current.remainingSeconds).toBe(0);
  });

  it('should start break, stop current project timer, and initialize countdown', () => {
    // Arrange
    const { result } = renderHook(() =>
      useProjectBreakTimer({ onStartTimer, onStopTimer })
    );

    // Act
    act(() => {
      result.current.startBreak('proj-1', 'task-10', 5);
    });

    // Assert
    expect(onStopTimer).toHaveBeenCalledWith('proj-1');
    expect(result.current.isBreakActive).toBe(true);
    expect(result.current.remainingSeconds).toBe(300);
    expect(result.current.formattedRemaining).toBe('05:00');
    expect(result.current.progressPercent).toBe(0);
  });

  it('should tick down remaining seconds each second', () => {
    // Arrange
    const { result } = renderHook(() =>
      useProjectBreakTimer({ onStartTimer, onStopTimer })
    );
    act(() => {
      result.current.startBreak('proj-1', 'task-10', 2);
    });

    // Act
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // Assert
    expect(result.current.remainingSeconds).toBe(90);
    expect(result.current.formattedRemaining).toBe('01:30');
    expect(result.current.progressPercent).toBe(25);
  });

  it('should automatically resume task when countdown reaches zero', () => {
    // Arrange
    const { result } = renderHook(() =>
      useProjectBreakTimer({ onStartTimer, onStopTimer })
    );
    act(() => {
      result.current.startBreak('proj-1', 'task-10', 1);
    });

    // Act
    act(() => {
      vi.advanceTimersByTime(60000);
    });

    // Assert
    expect(onStartTimer).toHaveBeenCalledWith('task-10');
    expect(result.current.isBreakActive).toBe(false);
    expect(result.current.breakState).toBeNull();
    expect(result.current.remainingSeconds).toBe(0);
  });

  it('should resume task immediately when resumeWorkNow is called', () => {
    // Arrange
    const { result } = renderHook(() =>
      useProjectBreakTimer({ onStartTimer, onStopTimer })
    );
    act(() => {
      result.current.startBreak('proj-1', 'task-10', 5);
    });

    // Act
    act(() => {
      result.current.resumeWorkNow();
    });

    // Assert
    expect(onStartTimer).toHaveBeenCalledWith('task-10');
    expect(result.current.isBreakActive).toBe(false);
    expect(result.current.breakState).toBeNull();
  });

  it('should cancel break without resuming task when cancelBreak is called', () => {
    // Arrange
    const { result } = renderHook(() =>
      useProjectBreakTimer({ onStartTimer, onStopTimer })
    );
    act(() => {
      result.current.startBreak('proj-1', 'task-10', 5);
    });

    // Act
    act(() => {
      result.current.cancelBreak();
    });

    // Assert
    expect(onStartTimer).not.toHaveBeenCalled();
    expect(result.current.isBreakActive).toBe(false);
    expect(result.current.breakState).toBeNull();
  });

  it('should restore persisted active break from localStorage on mount', () => {
    // Arrange
    const breakEndTimeMs = Date.now() + 120000;
    localStorage.setItem(
      'oxy_active_break_timer',
      JSON.stringify({
        projectId: 'proj-restored',
        taskId: 'task-restored',
        totalSeconds: 120,
        breakEndTimeMs,
      })
    );

    // Act
    const { result } = renderHook(() =>
      useProjectBreakTimer({ onStartTimer, onStopTimer })
    );

    // Assert
    expect(result.current.isBreakActive).toBe(true);
    expect(result.current.remainingSeconds).toBe(120);
    expect(result.current.breakState?.projectId).toBe('proj-restored');
    expect(result.current.breakState?.taskId).toBe('task-restored');
  });
});

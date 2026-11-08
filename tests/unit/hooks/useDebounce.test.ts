import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useDebounce } from '@common/hooks/useDebounce';

describe('Unit Tests: useDebounce hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Given initial value, When hook is mounted, Then returns initial value immediately', () => {
    // Arrange & Act
    const { result } = renderHook(() => useDebounce('initial', 300));

    // Assert
    expect(result.current).toBe('initial');
  });

  it('Given value changes, When time is less than delay, Then debounced value does not update', () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ val, delay }) => useDebounce(val, delay),
      { initialProps: { val: 'first', delay: 300 } }
    );

    // Act
    rerender({ val: 'second', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Assert
    expect(result.current).toBe('first');
  });

  it('Given value changes, When delay has elapsed, Then debounced value updates to the latest value', () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ val, delay }) => useDebounce(val, delay),
      { initialProps: { val: 'first', delay: 300 } }
    );

    // Act
    rerender({ val: 'second', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Assert
    expect(result.current).toBe('second');
  });

  it('Given rapid sequential value changes, When timers advance, Then cancels intermediate timers and debounces to final value', () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ val, delay }) => useDebounce(val, delay),
      { initialProps: { val: 'a', delay: 300 } }
    );

    // Act
    rerender({ val: 'b', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ val: 'c', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    rerender({ val: 'd', delay: 300 });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Assert
    expect(result.current).toBe('d');
  });

  it('Given delay <= 0, When value changes, Then updates immediately', () => {
    // Arrange
    const { result, rerender } = renderHook(
      ({ val, delay }) => useDebounce(val, delay),
      { initialProps: { val: 'first', delay: 0 } }
    );

    // Act
    rerender({ val: 'updated-fast', delay: 0 });

    // Assert
    expect(result.current).toBe('updated-fast');
  });

  it('Given active debounce timer, When unmounted, Then cleans up timeout safely', () => {
    // Arrange
    const { unmount } = renderHook(() => useDebounce('test', 500));
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    // Act
    unmount();

    // Assert
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});

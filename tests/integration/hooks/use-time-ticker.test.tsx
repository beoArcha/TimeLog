import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTimeTicker } from '../../../src/hooks/useTimeTicker';

const TickerConsumer = () => {
  const { nowIso } = useTimeTicker();
  return <div data-testid="time-display">{nowIso}</div>;
};

describe('Integration Tests: useTimeTicker Lifecycle & Component Rendering', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should trigger re-renders and update DOM text value when interval ticks', () => {
    render(<TickerConsumer />);

    const displayElement = screen.getByTestId('time-display');
    const firstVal = displayElement.textContent;
    expect(firstVal).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    const secondVal = displayElement.textContent;
    expect(secondVal).not.toEqual(firstVal);
    expect(new Date(secondVal!).getTime() - new Date(firstVal!).getTime()).toBeGreaterThanOrEqual(1000);
  });

  it('should clean up interval and stop ticking when consumer component unmounts', () => {
    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    const { unmount } = render(<TickerConsumer />);

    expect(clearIntervalSpy).not.toHaveBeenCalled();

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});

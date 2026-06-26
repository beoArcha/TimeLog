import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useTimeTicker } from '@common/hooks/useTimeTicker';
import { TEST_CONSTANTS } from '../../shared/test-constants';

describe('Unit Tests: useTimeTicker Hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_update_nowIso_every_second_when_active', () => {
    const { result } = renderHook(() => useTimeTicker());
    const initialTime = result.current.nowIso;

    act(() => {
      vi.advanceTimersByTime(TEST_CONSTANTS.ONE_SECOND);
    });

    expect(result.current.nowIso).not.toEqual(initialTime);
    expect(new Date(result.current.nowIso).getTime() - new Date(initialTime).getTime()).toBeGreaterThanOrEqual(TEST_CONSTANTS.ONE_SECOND);
  });
});

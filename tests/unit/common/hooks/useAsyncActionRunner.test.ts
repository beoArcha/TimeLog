import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAsyncActionRunner } from '@common/hooks/data/useAsyncActionRunner';

describe('useAsyncActionRunner', () => {
  it('should execute action and update loading state when triggered', async () => {
    // Arrange
    const { result } = renderHook(() => useAsyncActionRunner());
    const actionMock = vi.fn().mockResolvedValue('success');

    // Act
    let output: string | undefined;
    await act(async () => {
      output = await result.current.runAction('Error message', actionMock);
    });

    // Assert
    expect(output).toBe('success');
    expect(actionMock).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.repositoryError).toBeNull();
  });

  it('should ignore duplicate concurrent action when triggered rapidly without allowConcurrent', async () => {
    // Arrange
    const { result } = renderHook(() => useAsyncActionRunner());
    let resolveFirstAction: (val: string) => void = () => {};
    const firstActionPromise = new Promise<string>((resolve) => {
      resolveFirstAction = resolve;
    });
    const firstAction = vi.fn().mockImplementation(() => firstActionPromise);
    const secondAction = vi.fn().mockResolvedValue('ignored');

    // Act - Trigger first action (it stays in flight)
    let firstResultPromise: Promise<string | undefined>;
    act(() => {
      firstResultPromise = result.current.runAction('First action error', firstAction);
    });

    // Act - Immediately trigger second action while first is still executing
    let secondResult: string | undefined;
    await act(async () => {
      secondResult = await result.current.runAction('Second action error', secondAction);
    });

    // Resolve first action
    await act(async () => {
      resolveFirstAction('first_done');
      await firstResultPromise;
    });

    // Assert
    expect(firstAction).toHaveBeenCalledTimes(1);
    expect(secondAction).not.toHaveBeenCalled();
    expect(secondResult).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should capture repositoryError when action throws an exception', async () => {
    // Arrange
    const { result } = renderHook(() => useAsyncActionRunner());
    const failingAction = vi.fn().mockRejectedValue(new Error('Network failure'));

    // Act
    await act(async () => {
      await result.current.runAction('Custom error fallback', failingAction);
    });

    // Assert
    expect(result.current.repositoryError).toBe('Network failure');
    expect(result.current.isLoading).toBe(false);
  });
});

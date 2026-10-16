import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAsyncActionRunner } from '@common/hooks/data/useAsyncActionRunner';
import { ErrorHandler } from '@common/exceptions';

describe('Unit Tests: useAsyncActionRunner Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with not loading and null error', () => {
    const { result } = renderHook(() => useAsyncActionRunner());
    expect(result.current.isLoading).toBe(false);
    expect(result.current.repositoryError).toBeNull();
  });

  it('should execute action successfully and return result', async () => {
    const { result } = renderHook(() => useAsyncActionRunner());

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.runAction('test operation', async () => 'success_value');
    });

    expect(returned).toBe('success_value');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.repositoryError).toBeNull();
  });

  it('should set isLoading to true while action is in flight and reset to false when complete', async () => {
    const { result } = renderHook(() => useAsyncActionRunner());
    let resolveAction!: (val: string) => void;
    const pendingPromise = new Promise<string>((resolve) => {
      resolveAction = resolve;
    });

    let actionPromise: Promise<string | undefined>;
    act(() => {
      actionPromise = result.current.runAction('pending operation', () => pendingPromise);
    });

    // In-flight state: must be true to prevent mutant deletion of setIsLoading(true)
    expect(result.current.isLoading).toBe(true);

    // Complete the pending promise
    await act(async () => {
      resolveAction('done');
      await actionPromise;
    });

    // Final state: must be false
    expect(result.current.isLoading).toBe(false);
  });

  it('should not set isLoading when withLoading option is false', async () => {
    const { result } = renderHook(() => useAsyncActionRunner());
    let resolveAction!: (val: string) => void;
    const pendingPromise = new Promise<string>((resolve) => {
      resolveAction = resolve;
    });

    let actionPromise: Promise<string | undefined>;
    act(() => {
      actionPromise = result.current.runAction('silent operation', () => pendingPromise, { withLoading: false });
    });

    // When withLoading is false, isLoading should remain false during flight
    expect(result.current.isLoading).toBe(false);

    await act(async () => {
      resolveAction('done');
      await actionPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should capture error, invoke ErrorHandler, and set repositoryError on failure', async () => {
    const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    const { result } = renderHook(() => useAsyncActionRunner());

    let returned: string | undefined;
    await act(async () => {
      returned = await result.current.runAction('failing operation', async () => {
        throw new Error('Something went wrong');
      });
    });

    expect(returned).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.repositoryError).toBe('Something went wrong');
    expect(errorHandlerSpy).toHaveBeenCalled();
  });

  it('should rethrow error when rethrow option is true', async () => {
    vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    const { result } = renderHook(() => useAsyncActionRunner());

    await act(async () => {
      await expect(
        result.current.runAction(
          'critical operation',
          async () => {
            throw new Error('Critical failure');
          },
          { rethrow: true }
        )
      ).rejects.toThrow('Critical failure');
    });

    expect(result.current.repositoryError).toBe('Critical failure');
  });
});

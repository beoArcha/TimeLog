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

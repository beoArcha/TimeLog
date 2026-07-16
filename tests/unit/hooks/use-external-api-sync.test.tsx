import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useExternalApiSync } from '@common/hooks/useExternalApiSync';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';
import { STORAGE_KEYS } from '@common/constants';
import { TEST_CONSTANTS } from '@tests/shared/test-constants';

describe('Unit Tests: useExternalApiSync Hook', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true }) } as any);
    vi.spyOn(console, 'log').mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should_load_saved_configs_when_initialized', () => {
    localStorage.setItem(STORAGE_KEYS.LOG_TO_API, 'true');
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, TEST_CONSTANTS.API_TOKEN);

    const { result } = renderHook(() => useExternalApiSync());

    expect(result.current.logToApi).toBe(true);
    expect(result.current.apiToken).toBe(TEST_CONSTANTS.API_TOKEN);
  });

  it('should_call_fetch_when_pushToApi_is_called_and_logging_is_enabled', () => {
    const { result } = renderHook(() => useExternalApiSync());

    act(() => {
      result.current.setLogToApi(true);
      result.current.setApiUrl(TEST_CONSTANTS.API_URL);
      result.current.setApiToken(TEST_CONSTANTS.API_TOKEN_SHORT);
    });

    act(() => {
      result.current.pushToApi({ id: 1 }, 'Log message');
    });

    expect(global.fetch).toHaveBeenCalledWith(TEST_CONSTANTS.API_URL, expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: `Bearer ${TEST_CONSTANTS.API_TOKEN_SHORT}`,
      }),
    }));
  });

  it('should_fall_back_to_console_log_when_pushToApi_is_called_and_logging_is_disabled', () => {
    const { result } = renderHook(() => useExternalApiSync());

    act(() => {
      result.current.setLogToApi(false);
    });

    act(() => {
      result.current.pushToApi({ id: 1 }, 'Log message');
    });

    expect(global.fetch).not.toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[FILE APPEND logs.txt] Log message'));
  });
});

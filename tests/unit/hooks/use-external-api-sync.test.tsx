import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useExternalApiSync } from '@common/hooks/useExternalApiSync';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';
import { TEST_CONSTANTS } from '@tests/shared/test-constants';
import { STORAGE_KEYS } from '@common/constants';

describe('Unit Tests: useExternalApiSync Hook', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true }) } as any);
    vi.spyOn(console, 'log').mockImplementation(() => { });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should_load_saved_configs_when_initialized', async () => {
    localStorage.setItem(STORAGE_KEYS.LOG_TO_API, 'true');
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, TEST_CONSTANTS.API_TOKEN);
    localStorage.setItem(STORAGE_KEYS.API_URL, '');
    localStorage.setItem(STORAGE_KEYS.API_METHOD, 'POST');
    localStorage.setItem(STORAGE_KEYS.API_HEADERS, '');

    const { result } = renderHook(() => useExternalApiSync());

    await waitFor(() => {
      expect(result.current.logToApi).toBe(true);
    });
    expect(result.current.apiToken).toBe(TEST_CONSTANTS.API_TOKEN);
  });

  it('should_call_fetch_when_pushToApi_is_called_and_logging_is_enabled', async () => {
    localStorage.setItem(STORAGE_KEYS.LOG_TO_API, 'true');
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, TEST_CONSTANTS.API_TOKEN);
    localStorage.setItem(STORAGE_KEYS.API_URL, TEST_CONSTANTS.API_URL);
    localStorage.setItem(STORAGE_KEYS.API_METHOD, 'POST');
    localStorage.setItem(STORAGE_KEYS.API_HEADERS, '');

    const { result } = renderHook(() => useExternalApiSync());

    await waitFor(() => {
      expect(result.current.logToApi).toBe(true);
    });

    await act(async () => {
      await result.current.pushToApi({}, 'Test Log');
    });

    expect(global.fetch).toHaveBeenCalledWith(TEST_CONSTANTS.API_URL, expect.any(Object));
  });

  it('should_fall_back_to_console_log_when_pushToApi_is_called_and_logging_is_disabled', async () => {
    localStorage.setItem('timelog_persistence_plugin_logToApi', 'false');
    localStorage.setItem('timelog_persistence_plugin_apiToken', TEST_CONSTANTS.API_TOKEN);
    localStorage.setItem('timelog_persistence_plugin_apiUrl', TEST_CONSTANTS.API_URL);
    localStorage.setItem('timelog_persistence_plugin_apiMethod', 'POST');
    localStorage.setItem('timelog_persistence_plugin_apiHeaders', '');

    const { result } = renderHook(() => useExternalApiSync());

    await waitFor(() => {
      expect(result.current.logToApi).toBe(false);
    });

    await act(async () => {
      await result.current.pushToApi({}, 'Test Log');
    });

    expect(console.log).toHaveBeenCalledWith('[FILE APPEND logs.txt] Test Log');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

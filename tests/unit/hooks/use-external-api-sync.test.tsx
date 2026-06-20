import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useExternalApiSync } from '../../../src/hooks/useExternalApiSync';
import { setupLocalStorageMock } from './test-helpers';

describe('Unit Tests: useExternalApiSync Hook', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    global.fetch = vi.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true }) } as any);
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should_load_saved_configs_when_initialized', () => {
    localStorage.setItem('oxytime_log_to_api', 'true');
    localStorage.setItem('oxytime_api_token', 'my-token');
    
    const { result } = renderHook(() => useExternalApiSync());
    
    expect(result.current.logToApi).toBe(true);
    expect(result.current.apiToken).toBe('my-token');
  });

  it('should_call_fetch_when_pushToApi_is_called_and_logging_is_enabled', () => {
    const { result } = renderHook(() => useExternalApiSync());
    
    act(() => {
      result.current.setLogToApi(true);
      result.current.setApiUrl('https://myapi.com/logs');
      result.current.setApiToken('tok');
    });

    act(() => {
      result.current.pushToApi({ id: 1 }, 'Log message');
    });

    expect(global.fetch).toHaveBeenCalledWith('https://myapi.com/logs', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        Authorization: 'Bearer tok',
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

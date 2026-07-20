import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppSettings } from '@common/hooks/useAppSettings';
import { setupLocalStorageMock, setupMatchMediaMock } from '@tests/shared/test-helpers';

describe('Unit Tests: useAppSettings Hook', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    setupMatchMediaMock(false);
  });

  it('should_load_saved_settings_when_initialized', async () => {
    localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify({
      theme: 'light',
      guiVariant: 'medium',
      textAndIconSize: 'medium',
      autoStart: false,
      autoPauseOnSleep: true,
      includePatchesInReports: true,
      activeSinks: ['Csv'],
      alwaysOnTopSmall: false,
      alwaysOnTopMain: false,
      minimizeToTray: true,
    }));

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.theme).toBe('light');
    });
    expect(result.current.layoutVariant).toBe('medium');
  });

  it('should_update_localStorage_when_textAndIconSize_changes', async () => {
    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.textAndIconSize).toBeTruthy();
    });

    await act(async () => {
      result.current.setTextAndIconSize('large');
    });

    expect(result.current.textAndIconSize).toBe('large');
  });

  it('should_resolve_theme_correctly_when_system_theme_is_queried', async () => {
    setupMatchMediaMock(true);

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.resolvedTheme).toBeTruthy();
    });

    await act(async () => {
      result.current.setTheme('system');
    });

    expect(result.current.resolvedTheme).toBe('light');
  });
});

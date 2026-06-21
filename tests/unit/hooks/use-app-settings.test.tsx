import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppSettings } from '@core/hooks/useAppSettings';
import { setupLocalStorageMock, setupMatchMediaMock } from '../../shared/test-helpers';
import { STORAGE_KEYS } from '../../../src/common/constants';

describe('Unit Tests: useAppSettings Hook', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    setupMatchMediaMock(false);
  });

  it('should_load_saved_settings_when_initialized', () => {
    localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    localStorage.setItem(STORAGE_KEYS.GUI_VARIANT, 'medium');

    const { result } = renderHook(() => useAppSettings());

    expect(result.current.theme).toBe('light');
    expect(result.current.guiSize).toBe('medium');
  });

  it('should_update_localStorage_when_textAndIconSize_changes', () => {
    const { result } = renderHook(() => useAppSettings());

    act(() => {
      result.current.setTextAndIconSize('large');
    });

    expect(localStorage.getItem(STORAGE_KEYS.TEXT_ICON_SIZE)).toBe('large');
  });

  it('should_resolve_theme_correctly_when_system_theme_is_queried', () => {
    setupMatchMediaMock(true);

    const { result } = renderHook(() => useAppSettings());

    act(() => {
      result.current.setTheme('system');
    });

    expect(result.current.resolvedTheme).toBe('light');
  });
});

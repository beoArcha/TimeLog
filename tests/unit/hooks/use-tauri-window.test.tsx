// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TAURI_COMMANDS } from '@common/tauri/tauri-commands';
import { TEST_CONSTANTS } from '@tests/shared/test-constants';

import {
  mockInvoke,
  mockListen,
  triggerTauriEvent,
  setupLocalStorageMock,
  setupMatchMediaMock,
} from '@tests/shared/test-helpers';

import { useTauriWindow } from '@common/tauri/useTauriWindow';

describe('Unit Tests: useTauriWindow Hook', () => {
  const defaultProps = {
    layoutVariant: 'full' as const,
    setLayoutVariant: vi.fn(),
    textAndIconSize: 'medium' as const,
    minimizeToTray: false,
    setMinimizeToTray: vi.fn(),
    alwaysOnTopSmall: false,
    setAlwaysOnTopSmall: vi.fn(),
    alwaysOnTopMain: false,
    setAlwaysOnTopMain: vi.fn(),
    lastNonCompactVariant: 'full' as const,
    setLastNonCompactVariant: vi.fn(),
    handleStopTimer: vi.fn(),
    locale: 'en' as const,
    customTranslations: {},
  };


  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
    setupMatchMediaMock(false);
    vi.spyOn(console, 'error').mockImplementation(() => { });
    (window as any).__TAURI_INTERNALS__ = {};
  });

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
    vi.restoreAllMocks();
  });

  const waitForListeners = async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
    });
  };

  it('should_invoke_set_layout_variant_on_mount', () => {
    renderHook(() => useTauriWindow(defaultProps));
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.SET_LAYOUT_VARIANT, { variant: 'full', textAndIconSize: 'medium' });
  });

  it('should_resize_to_large_and_trigger_toast_when_receiving_native_window_maximized_event', async () => {
    const { result } = renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('native-window-maximized');
    });

    expect(defaultProps.setLayoutVariant).toHaveBeenCalledWith('full');
    expect(result.current.trayNotification).toBe(TEST_CONSTANTS.TOAST_FULL);
  });

  it('should_resize_to_large_when_receiving_native_window_restored_event', async () => {
    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('native-window-restored');
    });

    expect(defaultProps.setLayoutVariant).toHaveBeenCalledWith('full');
  });

  it('should_change_layout_variant_when_receiving_tray_set_gui_variant_event', async () => {
    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('tray-set-gui-variant', 'medium');
    });

    expect(defaultProps.setLayoutVariant).toHaveBeenCalledWith('medium');
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.SET_LAYOUT_VARIANT, { variant: 'medium', textAndIconSize: 'medium' });
  });

  it('should_stop_timers_and_trigger_toast_when_receiving_tray_stop_all_timers_event', async () => {
    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('tray-stop-all-timers');
    });

    expect(defaultProps.handleStopTimer).toHaveBeenCalled();
  });

  it('should_toggle_always_on_top_when_receiving_tray_toggle_on_top_event', async () => {
    const setAlwaysOnTopMainSpy = vi.fn().mockImplementation(cb => {
      if (typeof cb === 'function') cb(false);
    });
    renderHook(() => useTauriWindow({
      ...defaultProps,
      setAlwaysOnTopMain: setAlwaysOnTopMainSpy,
    }));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('tray-toggle-on-top');
    });

    expect(setAlwaysOnTopMainSpy).toHaveBeenCalled();
  });

  it('should_toggle_always_on_top_small_when_layoutVariant_is_small_and_receiving_tray_toggle_on_top_event', async () => {
    const setAlwaysOnTopSmallSpy = vi.fn().mockImplementation(cb => {
      if (typeof cb === 'function') cb(false);
    });
    renderHook(() => useTauriWindow({
      ...defaultProps,
      layoutVariant: 'compact',
      setAlwaysOnTopSmall: setAlwaysOnTopSmallSpy,
    }));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('tray-toggle-on-top');
    });

    expect(setAlwaysOnTopSmallSpy).toHaveBeenCalled();
  });

  it('should_exit_app_on_close_requested_when_minimizeToTray_is_false', async () => {
    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('native-close-requested');
    });

    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.EXIT_APP);
  });

  it('should_toggle_minimize_to_tray_when_receiving_tray_toggle_minimize_to_tray_event', async () => {
    const setMinimizeToTray = vi.fn();
    renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: false,
      setMinimizeToTray,
    }));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('tray-toggle-minimize-to-tray', true);
    });
    await waitForListeners();

    expect(setMinimizeToTray).toHaveBeenCalledWith(true);
  });

  it('should_hide_window_on_close_requested_when_minimizeToTray_is_true', async () => {

    renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: true,
    }));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('native-close-requested');
    });

    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.HIDE_WINDOW);
  });

  it('should_invoke_hide_window_when_handleMinimizeToTray_is_called_with_minimizeToTray_true', async () => {
    const { result } = renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: true,
    }));

    await act(async () => {
      await result.current.handleMinimizeToTray();
    });

    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.HIDE_WINDOW);
  });

  it('should_invoke_close_window_when_handleCloseWindow_is_called', async () => {
    const { result } = renderHook(() => useTauriWindow(defaultProps));

    await act(async () => {
      await result.current.handleCloseWindow();
    });

    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.CLOSE_WINDOW);
  });

  it('should_invoke_minimize_window_when_handleMinimizeWindow_is_called', async () => {
    const { result } = renderHook(() => useTauriWindow(defaultProps));

    await act(async () => {
      await result.current.handleMinimizeWindow();
    });

    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.MINIMIZE_WINDOW);
  });

  it('should_set_isMinimized_when_handleMinimizeToTray_is_called_outside_tauri_with_minimizeToTray_true', async () => {
    delete (window as any).__TAURI_INTERNALS__;
    const { result } = renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: true,
    }));

    await act(async () => {
      await result.current.handleMinimizeToTray();
    });

    expect(result.current.isMinimized).toBe(true);
  });

  it('should_set_isGuiClosed_when_handleMinimizeToTray_is_called_outside_tauri_with_minimizeToTray_false', async () => {
    delete (window as any).__TAURI_INTERNALS__;
    const { result } = renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: false,
    }));

    await act(async () => {
      await result.current.handleMinimizeToTray();
    });

    expect(result.current.isGuiClosed).toBe(true);
  });

  it('should_set_isGuiClosed_when_handleCloseWindow_is_called_outside_tauri', async () => {
    delete (window as any).__TAURI_INTERNALS__;
    const { result } = renderHook(() => useTauriWindow(defaultProps));

    await act(async () => {
      await result.current.handleCloseWindow();
    });

    expect(result.current.isGuiClosed).toBe(true);
  });

  it('should_set_isMinimized_when_handleMinimizeWindow_is_called_outside_tauri', async () => {
    delete (window as any).__TAURI_INTERNALS__;
    const { result } = renderHook(() => useTauriWindow(defaultProps));

    await act(async () => {
      await result.current.handleMinimizeWindow();
    });

    expect(result.current.isMinimized).toBe(true);
  });


  it('should_log_error_when_tauri_invoke_fails', async () => {
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === TAURI_COMMANDS.HIDE_WINDOW) {
        return Promise.reject(new Error('Tauri API failure'));
      }
      return Promise.resolve();
    });

    const { result } = renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: true,
    }));

    await act(async () => {
      await result.current.handleMinimizeToTray();
    });

    expect(console.error).toHaveBeenCalled();
  });

  it('should_log_error_when_tauri_listener_setup_fails', async () => {
    mockListen.mockRejectedValueOnce(new Error('Mock listen error'));

    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    expect(console.error).toHaveBeenCalled();
  });

  it('should_invoke_exit_app_when_handleMinimizeToTray_is_called_in_tauri_with_minimizeToTray_false', async () => {
    const { result } = renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: false,
    }));

    await act(async () => {
      await result.current.handleMinimizeToTray();
    });

    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.EXIT_APP);
  });

  it('should_log_error_when_handleCloseWindow_fails_in_tauri', async () => {
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === TAURI_COMMANDS.CLOSE_WINDOW) {
        return Promise.reject(new Error('Tauri close error'));
      }
      return Promise.resolve();
    });

    const { result } = renderHook(() => useTauriWindow(defaultProps));

    await act(async () => {
      await result.current.handleCloseWindow();
    });

    expect(console.error).toHaveBeenCalled();
  });

  it('should_log_error_when_handleMinimizeWindow_fails_in_tauri', async () => {
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === TAURI_COMMANDS.MINIMIZE_WINDOW) {
        return Promise.reject(new Error('Tauri minimize error'));
      }
      return Promise.resolve();
    });

    const { result } = renderHook(() => useTauriWindow(defaultProps));

    await act(async () => {
      await result.current.handleMinimizeWindow();
    });

    expect(console.error).toHaveBeenCalled();
  });

  it('should_log_error_when_tauri_invoke_set_layout_variant_fails_on_mount', async () => {
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === TAURI_COMMANDS.SET_LAYOUT_VARIANT) {
        return Promise.reject(new Error('Tauri resize error'));
      }
      return Promise.resolve();
    });

    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    expect(console.error).toHaveBeenCalled();
  });

  it('should_log_error_when_tauri_invoke_set_always_on_top_fails_on_mount', async () => {
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === TAURI_COMMANDS.SET_ALWAYS_ON_TOP) {
        return Promise.reject(new Error('Tauri always on top error'));
      }
      return Promise.resolve();
    });

    renderHook(() => useTauriWindow(defaultProps));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 60));
    });

    expect(console.error).toHaveBeenCalled();
  });

  it('should_log_error_when_invoke_hide_window_fails_on_close_requested', async () => {
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === TAURI_COMMANDS.HIDE_WINDOW) {
        return Promise.reject(new Error('Hide window fail'));
      }
      return Promise.resolve();
    });

    renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: true,
    }));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('native-close-requested');
    });
    await waitForListeners();

    expect(console.error).toHaveBeenCalled();
  });

  it('should_log_error_when_invoke_exit_app_fails_on_close_requested', async () => {
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === TAURI_COMMANDS.EXIT_APP) {
        return Promise.reject(new Error('Exit app fail'));
      }
      return Promise.resolve();
    });

    renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: false,
    }));
    await waitForListeners();

    act(() => {
      triggerTauriEvent('native-close-requested');
    });
    await waitForListeners();

    expect(console.error).toHaveBeenCalled();
  });

  it('should_call_all_unlisteners_on_unmount', async () => {
    const unlistenSpy = vi.fn();
    mockListen.mockResolvedValue(unlistenSpy);

    const { unmount } = renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    unmount();
    await waitForListeners();

    expect(unlistenSpy).toHaveBeenCalled();
  });

  it('should_log_error_when_tauri_invoke_set_minimize_to_tray_fails_on_mount', async () => {
    mockInvoke.mockImplementation((cmd) => {
      if (cmd === TAURI_COMMANDS.SET_MINIMIZE_TO_TRAY) {
        return Promise.reject(new Error('Tauri minimize to tray sync fail'));
      }
      return Promise.resolve();
    });

    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    expect(console.error).toHaveBeenCalled();
  });
});

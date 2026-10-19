// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { TAURI_COMMANDS } from '@common/tauri/tauri-commands';
import { TEST_CONSTANTS } from '@tests/shared/test-constants';
import {
  mockInvoke,
  mockListen,
  triggerTauriEvent,
  setupLocalStorageMock,
  setupMatchMediaMock,
  setTauriDesktopEnvironment,
} from '@tests/shared/test-helpers';
import { useTauriWindow } from '@common/tauri/useTauriWindow';

describe('Unit: useTauriWindow - Native Window and Tray Events', () => {
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
    vi.spyOn(console, 'error').mockImplementation(() => {});
    setTauriDesktopEnvironment(true);
  });

  afterEach(() => {
    setTauriDesktopEnvironment(false);
    vi.restoreAllMocks();
  });

  const waitForListeners = async () => {
    await waitFor(() => {
      expect(mockListen).toHaveBeenCalledWith('native-close-requested', expect.any(Function));
    });
  };

  it('should invoke set layout variant on mount', () => {
    // Act
    renderHook(() => useTauriWindow(defaultProps));

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.SET_LAYOUT_VARIANT, {
      variant: 'full',
      textAndIconSize: 'medium',
    });
  });

  it('should resize to large and trigger toast when receiving native window maximized event', async () => {
    // Arrange
    const { result } = renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    // Act
    act(() => {
      triggerTauriEvent('native-window-maximized');
    });

    // Assert
    expect(defaultProps.setLayoutVariant).toHaveBeenCalledWith('full');
    expect(result.current.trayNotification).toBe(TEST_CONSTANTS.TOAST_FULL);
  });

  it('should resize to large when receiving native window restored event', async () => {
    // Arrange
    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    // Act
    act(() => {
      triggerTauriEvent('native-window-restored');
    });

    // Assert
    expect(defaultProps.setLayoutVariant).toHaveBeenCalledWith('full');
  });

  it('should change layout variant when receiving tray set gui variant event', async () => {
    // Arrange
    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    // Act
    act(() => {
      triggerTauriEvent('tray-set-gui-variant', 'medium');
    });

    // Assert
    expect(defaultProps.setLayoutVariant).toHaveBeenCalledWith('medium');
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.SET_LAYOUT_VARIANT, {
      variant: 'medium',
      textAndIconSize: 'medium',
    });
  });

  it('should stop timers when receiving tray stop all timers event', async () => {
    // Arrange
    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    // Act
    act(() => {
      triggerTauriEvent('tray-stop-all-timers');
    });

    // Assert
    expect(defaultProps.handleStopTimer).toHaveBeenCalled();
  });

  it('should toggle always on top main when receiving tray toggle on top in large layout', async () => {
    // Arrange
    const setAlwaysOnTopMainSpy = vi.fn().mockImplementation(cb => {
      if (typeof cb === 'function') cb(false);
    });
    renderHook(() =>
      useTauriWindow({
        ...defaultProps,
        setAlwaysOnTopMain: setAlwaysOnTopMainSpy,
      })
    );
    await waitForListeners();

    // Act
    act(() => {
      triggerTauriEvent('tray-toggle-on-top');
    });

    // Assert
    expect(setAlwaysOnTopMainSpy).toHaveBeenCalled();
  });

  it('should toggle always on top small when receiving tray toggle on top in compact layout', async () => {
    // Arrange
    const setAlwaysOnTopSmallSpy = vi.fn().mockImplementation(cb => {
      if (typeof cb === 'function') cb(false);
    });
    renderHook(() =>
      useTauriWindow({
        ...defaultProps,
        layoutVariant: 'compact',
        setAlwaysOnTopSmall: setAlwaysOnTopSmallSpy,
      })
    );
    await waitForListeners();

    // Act
    act(() => {
      triggerTauriEvent('tray-toggle-on-top');
    });

    // Assert
    expect(setAlwaysOnTopSmallSpy).toHaveBeenCalled();
  });

  it('should exit app on close requested when minimizeToTray is false', async () => {
    // Arrange
    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    // Act
    act(() => {
      triggerTauriEvent('native-close-requested');
    });

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.EXIT_APP);
  });

  it('should hide window on close requested when minimizeToTray is true', async () => {
    // Arrange
    renderHook(() =>
      useTauriWindow({
        ...defaultProps,
        minimizeToTray: true,
      })
    );
    await waitForListeners();

    // Act
    act(() => {
      triggerTauriEvent('native-close-requested');
    });

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.HIDE_WINDOW);
  });

  it('should toggle minimize to tray when receiving tray toggle minimize to tray event', async () => {
    // Arrange
    const setMinimizeToTray = vi.fn();
    const { result } = renderHook(() =>
      useTauriWindow({
        ...defaultProps,
        minimizeToTray: false,
        setMinimizeToTray,
      })
    );
    await waitForListeners();

    // Act
    act(() => {
      triggerTauriEvent('tray-toggle-minimize-to-tray', true);
    });

    // Assert
    expect(setMinimizeToTray).toHaveBeenCalledWith(true);
    expect(result.current.trayNotification).toBe('Minimize to tray: ON');
  });

  it('should call all unlisteners on unmount', async () => {
    // Arrange
    const unlistenSpy = vi.fn();
    mockListen.mockResolvedValue(unlistenSpy);

    const { unmount } = renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    // Act
    unmount();

    // Assert
    await waitFor(() => {
      expect(unlistenSpy).toHaveBeenCalled();
    });
  });
});

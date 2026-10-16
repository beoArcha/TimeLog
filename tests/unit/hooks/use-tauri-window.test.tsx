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

describe('useTauriWindow', () => {
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

  it('should stop timers and trigger toast when receiving tray stop all timers event', async () => {
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

  it('should toggle always on top when receiving tray toggle on top event in large layout', async () => {
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

  it('should toggle always on top small when receiving tray toggle on top event in compact layout', async () => {
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

  it('should invoke hide window when handleMinimizeToTray is called with minimizeToTray true in tauri', async () => {
    // Arrange
    const { result } = renderHook(() =>
      useTauriWindow({
        ...defaultProps,
        minimizeToTray: true,
      })
    );

    // Act
    await act(async () => {
      await result.current.handleMinimizeToTray();
    });

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.HIDE_WINDOW);
  });

  it('should invoke close window when handleCloseWindow is called in tauri', async () => {
    // Arrange
    const { result } = renderHook(() => useTauriWindow(defaultProps));

    // Act
    await act(async () => {
      await result.current.handleCloseWindow();
    });

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.CLOSE_WINDOW);
  });

  it('should invoke minimize window when handleMinimizeWindow is called in tauri', async () => {
    // Arrange
    const { result } = renderHook(() => useTauriWindow(defaultProps));

    // Act
    await act(async () => {
      await result.current.handleMinimizeWindow();
    });

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.MINIMIZE_WINDOW);
  });

  it('should set isMinimized when handleMinimizeToTray is called outside tauri with minimizeToTray true', async () => {
    // Arrange
    setTauriDesktopEnvironment(false);
    const { result } = renderHook(() =>
      useTauriWindow({
        ...defaultProps,
        minimizeToTray: true,
      })
    );

    // Act
    await act(async () => {
      await result.current.handleMinimizeToTray();
    });

    // Assert
    expect(result.current.isMinimized).toBe(true);
  });

  it('should set isGuiClosed when handleMinimizeToTray is called outside tauri with minimizeToTray false', async () => {
    // Arrange
    setTauriDesktopEnvironment(false);
    const { result } = renderHook(() =>
      useTauriWindow({
        ...defaultProps,
        minimizeToTray: false,
      })
    );

    // Act
    await act(async () => {
      await result.current.handleMinimizeToTray();
    });

    // Assert
    expect(result.current.isGuiClosed).toBe(true);
  });

  it('should set isGuiClosed when handleCloseWindow is called outside tauri', async () => {
    // Arrange
    setTauriDesktopEnvironment(false);
    const { result } = renderHook(() => useTauriWindow(defaultProps));

    // Act
    await act(async () => {
      await result.current.handleCloseWindow();
    });

    // Assert
    expect(result.current.isGuiClosed).toBe(true);
  });

  it('should set isMinimized when handleMinimizeWindow is called outside tauri', async () => {
    // Arrange
    setTauriDesktopEnvironment(false);
    const { result } = renderHook(() => useTauriWindow(defaultProps));

    // Act
    await act(async () => {
      await result.current.handleMinimizeWindow();
    });

    // Assert
    expect(result.current.isMinimized).toBe(true);
  });

  it('should log error when tauri invoke fails on handleMinimizeToTray', async () => {
    // Arrange
    mockInvoke.mockImplementation(cmd => {
      if (cmd === TAURI_COMMANDS.HIDE_WINDOW) {
        return Promise.reject(new Error('Tauri API failure'));
      }
      return Promise.resolve();
    });

    const { result } = renderHook(() =>
      useTauriWindow({
        ...defaultProps,
        minimizeToTray: true,
      })
    );

    // Act
    await act(async () => {
      await result.current.handleMinimizeToTray();
    });

    // Assert
    expect(console.error).toHaveBeenCalled();
  });

  it('should log error when tauri listener setup fails', async () => {
    // Arrange
    mockListen.mockRejectedValueOnce(new Error('Mock listen error'));

    // Act
    renderHook(() => useTauriWindow(defaultProps));

    // Assert
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('should invoke exit app when handleMinimizeToTray is called in tauri with minimizeToTray false', async () => {
    // Arrange
    const { result } = renderHook(() =>
      useTauriWindow({
        ...defaultProps,
        minimizeToTray: false,
      })
    );

    // Act
    await act(async () => {
      await result.current.handleMinimizeToTray();
    });

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.EXIT_APP);
  });

  it('should log error when handleCloseWindow fails in tauri', async () => {
    // Arrange
    mockInvoke.mockImplementation(cmd => {
      if (cmd === TAURI_COMMANDS.CLOSE_WINDOW) {
        return Promise.reject(new Error('Tauri close error'));
      }
      return Promise.resolve();
    });

    const { result } = renderHook(() => useTauriWindow(defaultProps));

    // Act
    await act(async () => {
      await result.current.handleCloseWindow();
    });

    // Assert
    expect(console.error).toHaveBeenCalled();
  });

  it('should log error when handleMinimizeWindow fails in tauri', async () => {
    // Arrange
    mockInvoke.mockImplementation(cmd => {
      if (cmd === TAURI_COMMANDS.MINIMIZE_WINDOW) {
        return Promise.reject(new Error('Tauri minimize error'));
      }
      return Promise.resolve();
    });

    const { result } = renderHook(() => useTauriWindow(defaultProps));

    // Act
    await act(async () => {
      await result.current.handleMinimizeWindow();
    });

    // Assert
    expect(console.error).toHaveBeenCalled();
  });

  it('should log error when tauri invoke set layout variant fails on mount', async () => {
    // Arrange
    mockInvoke.mockImplementation(cmd => {
      if (cmd === TAURI_COMMANDS.SET_LAYOUT_VARIANT) {
        return Promise.reject(new Error('Tauri resize error'));
      }
      return Promise.resolve();
    });

    // Act
    renderHook(() => useTauriWindow(defaultProps));

    // Assert
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('should log error when tauri invoke set always on top fails on mount', async () => {
    // Arrange
    mockInvoke.mockImplementation(cmd => {
      if (cmd === TAURI_COMMANDS.SET_ALWAYS_ON_TOP) {
        return Promise.reject(new Error('Tauri always on top error'));
      }
      return Promise.resolve();
    });

    // Act
    renderHook(() => useTauriWindow(defaultProps));

    // Assert
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('should log error when invoke hide window fails on close requested', async () => {
    // Arrange
    mockInvoke.mockImplementation(cmd => {
      if (cmd === TAURI_COMMANDS.HIDE_WINDOW) {
        return Promise.reject(new Error('Hide window fail'));
      }
      return Promise.resolve();
    });

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
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('should log error when invoke exit app fails on close requested', async () => {
    // Arrange
    mockInvoke.mockImplementation(cmd => {
      if (cmd === TAURI_COMMANDS.EXIT_APP) {
        return Promise.reject(new Error('Exit app fail'));
      }
      return Promise.resolve();
    });

    renderHook(() =>
      useTauriWindow({
        ...defaultProps,
        minimizeToTray: false,
      })
    );
    await waitForListeners();

    // Act
    act(() => {
      triggerTauriEvent('native-close-requested');
    });

    // Assert
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
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

  it('should log error when tauri invoke set minimize to tray fails on mount', async () => {
    // Arrange
    mockInvoke.mockImplementation(cmd => {
      if (cmd === TAURI_COMMANDS.SET_MINIMIZE_TO_TRAY) {
        return Promise.reject(new Error('Tauri minimize to tray sync fail'));
      }
      return Promise.resolve();
    });

    // Act
    renderHook(() => useTauriWindow(defaultProps));

    // Assert
    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });
});

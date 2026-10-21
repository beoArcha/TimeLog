// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { TAURI_COMMANDS } from '@common/tauri/tauri-commands';
import {
  mockInvoke,
  mockListen,
  triggerTauriEvent,
  setupLocalStorageMock,
  setupMatchMediaMock,
  setTauriDesktopEnvironment,
} from '@tests/shared/test-helpers';
import { useTauriWindow } from '@common/tauri/useTauriWindow';

describe('Unit: useTauriWindow - Error Handling and Rejection Recovery', () => {
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

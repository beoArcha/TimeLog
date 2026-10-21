// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TAURI_COMMANDS } from '@common/tauri/tauri-commands';
import {
  mockInvoke,
  setupLocalStorageMock,
  setupMatchMediaMock,
  setTauriDesktopEnvironment,
} from '@tests/shared/test-helpers';
import { useTauriWindow } from '@common/tauri/useTauriWindow';

describe('Unit: useTauriWindow - Window Actions and Environment Fallbacks', () => {
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

  describe('Inside Tauri desktop environment', () => {
    it('should invoke hide window when handleMinimizeToTray is called with minimizeToTray true', async () => {
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

    it('should invoke exit app when handleMinimizeToTray is called with minimizeToTray false', async () => {
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

    it('should invoke close window when handleCloseWindow is called', async () => {
      // Arrange
      const { result } = renderHook(() => useTauriWindow(defaultProps));

      // Act
      await act(async () => {
        await result.current.handleCloseWindow();
      });

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.CLOSE_WINDOW);
    });

    it('should invoke minimize window when handleMinimizeWindow is called', async () => {
      // Arrange
      const { result } = renderHook(() => useTauriWindow(defaultProps));

      // Act
      await act(async () => {
        await result.current.handleMinimizeWindow();
      });

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.MINIMIZE_WINDOW);
    });
  });

  describe('Outside Tauri environment (Browser fallback)', () => {
    beforeEach(() => {
      setTauriDesktopEnvironment(false);
    });

    it('should set isMinimized when handleMinimizeToTray is called with minimizeToTray true', async () => {
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
      expect(result.current.isMinimized).toBe(true);
    });

    it('should set isGuiClosed when handleMinimizeToTray is called with minimizeToTray false', async () => {
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
      expect(result.current.isGuiClosed).toBe(true);
    });

    it('should set isGuiClosed when handleCloseWindow is called', async () => {
      // Arrange
      const { result } = renderHook(() => useTauriWindow(defaultProps));

      // Act
      await act(async () => {
        await result.current.handleCloseWindow();
      });

      // Assert
      expect(result.current.isGuiClosed).toBe(true);
    });

    it('should set isMinimized when handleMinimizeWindow is called', async () => {
      // Arrange
      const { result } = renderHook(() => useTauriWindow(defaultProps));

      // Act
      await act(async () => {
        await result.current.handleMinimizeWindow();
      });

      // Assert
      expect(result.current.isMinimized).toBe(true);
    });
  });
});

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mockInvoke,
  tauriEventRegistry,
  triggerTauriEvent,
  setupLocalStorageMock,
  setupMatchMediaMock,
  setTauriDesktopEnvironment,
} from '@tests/shared/test-helpers';
import { useTauriWindow } from '@common/tauri/useTauriWindow';
import { TAURI_COMMANDS } from '@common/tauri/tauri-commands';

describe('Given useTauriWindow hook in desktop runtime', () => {
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
    setTauriDesktopEnvironment(true);
  });

  afterEach(() => {
    setTauriDesktopEnvironment(false);
  });

  const waitForListeners = async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
  };

  describe('When native-window-maximized event is dispatched', () => {
    it('Then it should adjust layout variant to full and record last non-compact variant', async () => {
      // Given
      renderHook(() => useTauriWindow(defaultProps));
      await waitForListeners();

      expect(tauriEventRegistry['native-window-maximized']).toBeDefined();

      // When
      triggerTauriEvent('native-window-maximized');

      // Then
      expect(defaultProps.setLayoutVariant).toHaveBeenCalledWith('full');
      expect(defaultProps.setLastNonCompactVariant).toHaveBeenCalledWith('full');
    });
  });

  describe('When tray-toggle-on-top event is triggered', () => {
    it('Then it should toggle always-on-top based on whether layout is compact or full', async () => {
      // Given
      const setAlwaysOnTopMainSpy = vi.fn();
      const setAlwaysOnTopSmallSpy = vi.fn();

      renderHook(() =>
        useTauriWindow({
          ...defaultProps,
          layoutVariant: 'full',
          setAlwaysOnTopMain: setAlwaysOnTopMainSpy,
          setAlwaysOnTopSmall: setAlwaysOnTopSmallSpy,
        })
      );
      await waitForListeners();

      // When
      triggerTauriEvent('tray-toggle-on-top');

      // Then
      expect(setAlwaysOnTopMainSpy).toHaveBeenCalled();
      expect(setAlwaysOnTopSmallSpy).not.toHaveBeenCalled();

      // Given compact layout
      vi.clearAllMocks();
      renderHook(() =>
        useTauriWindow({
          ...defaultProps,
          layoutVariant: 'compact',
          setAlwaysOnTopMain: setAlwaysOnTopMainSpy,
          setAlwaysOnTopSmall: setAlwaysOnTopSmallSpy,
        })
      );
      await waitForListeners();

      // When
      triggerTauriEvent('tray-toggle-on-top');

      // Then
      expect(setAlwaysOnTopSmallSpy).toHaveBeenCalled();
      expect(setAlwaysOnTopMainSpy).not.toHaveBeenCalled();
    });
  });

  describe('When native-close-requested event is received', () => {
    it('Then it should exit app when minimizeToTray is false, or hide window when true', async () => {
      // Given: minimizeToTray is false
      renderHook(() =>
        useTauriWindow({
          ...defaultProps,
          minimizeToTray: false,
        })
      );
      await waitForListeners();

      // When
      triggerTauriEvent('native-close-requested');

      // Then
      expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.EXIT_APP);

      // Given: minimizeToTray is true
      vi.clearAllMocks();
      renderHook(() =>
        useTauriWindow({
          ...defaultProps,
          minimizeToTray: true,
        })
      );
      await waitForListeners();

      // When
      triggerTauriEvent('native-close-requested');

      // Then
      expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.HIDE_WINDOW);
    });
  });

  describe('When tray-stop-all-timers event is received', () => {
    it('Then it should delegate to handleStopTimer callback', async () => {
      // Given
      const handleStopTimerSpy = vi.fn();
      renderHook(() =>
        useTauriWindow({
          ...defaultProps,
          handleStopTimer: handleStopTimerSpy,
        })
      );
      await waitForListeners();

      // When
      triggerTauriEvent('tray-stop-all-timers');

      // Then
      expect(handleStopTimerSpy).toHaveBeenCalled();
    });
  });
});

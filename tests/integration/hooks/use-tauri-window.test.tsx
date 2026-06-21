import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mockInvoke,
  tauriEventRegistry,
  triggerTauriEvent,
  setupLocalStorageMock,
  setupMatchMediaMock,
} from '../../shared/test-helpers';
import { useTauriWindow } from '@/src/core/hooks/useTauriWindow';
import { TAURI_COMMANDS } from '../../../src/common/constants';

describe('Integration Tests: useTauriWindow Events Integration', () => {
  const defaultProps = {
    guiSize: 'large' as const,
    setGuiSize: vi.fn(),
    textAndIconSize: 'medium' as const,
    minimizeToTray: false,
    alwaysOnTopSmall: false,
    setAlwaysOnTopSmall: vi.fn(),
    alwaysOnTopMain: false,
    setAlwaysOnTopMain: vi.fn(),
    lastNonSmallVariant: 'large' as const,
    setLastNonSmallVariant: vi.fn(),
    handleStopTimer: vi.fn(),
    locale: 'en' as const,
    customTranslations: {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    setupLocalStorageMock();
    setupMatchMediaMock(false);
    // Simulate being inside Tauri
    (window as any).__TAURI_INTERNALS__ = {};
  });

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
  });

  const waitForListeners = async () => {
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });
  };

  it('should register event listeners and respond to native-window-maximized by resizing', async () => {
    renderHook(() => useTauriWindow(defaultProps));
    await waitForListeners();

    expect(tauriEventRegistry['native-window-maximized']).toBeDefined();
    triggerTauriEvent('native-window-maximized');

    expect(defaultProps.setGuiSize).toHaveBeenCalledWith('large');
    expect(defaultProps.setLastNonSmallVariant).toHaveBeenCalledWith('large');
  });

  it('should toggle alwaysOnTop state through tray-toggle-on-top event based on current guiSize', async () => {
    const setAlwaysOnTopMainSpy = vi.fn();
    const setAlwaysOnTopSmallSpy = vi.fn();

    renderHook(() => useTauriWindow({
      ...defaultProps,
      guiSize: 'large',
      setAlwaysOnTopMain: setAlwaysOnTopMainSpy,
      setAlwaysOnTopSmall: setAlwaysOnTopSmallSpy,
    }));
    await waitForListeners();

    triggerTauriEvent('tray-toggle-on-top');
    expect(setAlwaysOnTopMainSpy).toHaveBeenCalled();
    expect(setAlwaysOnTopSmallSpy).not.toHaveBeenCalled();

    vi.clearAllMocks();
    renderHook(() => useTauriWindow({
      ...defaultProps,
      guiSize: 'small',
      setAlwaysOnTopMain: setAlwaysOnTopMainSpy,
      setAlwaysOnTopSmall: setAlwaysOnTopSmallSpy,
    }));
    await waitForListeners();

    triggerTauriEvent('tray-toggle-on-top');
    expect(setAlwaysOnTopSmallSpy).toHaveBeenCalled();
    expect(setAlwaysOnTopMainSpy).not.toHaveBeenCalled();
  });

  it('should execute close commands depending on minimizeToTray preference when close requested', async () => {
    renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: false,
    }));
    await waitForListeners();

    triggerTauriEvent('native-close-requested');
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.EXIT_APP);

    vi.clearAllMocks();
    renderHook(() => useTauriWindow({
      ...defaultProps,
      minimizeToTray: true,
    }));
    await waitForListeners();

    triggerTauriEvent('native-close-requested');
    expect(mockInvoke).toHaveBeenCalledWith(TAURI_COMMANDS.HIDE_WINDOW);
  });

  it('should stop active tracking timers on tray-stop-all-timers event', async () => {
    const handleStopTimerSpy = vi.fn();
    renderHook(() => useTauriWindow({
      ...defaultProps,
      handleStopTimer: handleStopTimerSpy,
    }));
    await waitForListeners();

    triggerTauriEvent('tray-stop-all-timers');
    expect(handleStopTimerSpy).toHaveBeenCalled();
  });
});

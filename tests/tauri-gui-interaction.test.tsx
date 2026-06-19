// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import App from '@/src/App';
import { LocaleProvider } from '@/src/providers/LocaleProvider';

// Mock tauri core invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/core', () => ({
  invoke: (cmd: string, args?: any) => {
    if (args !== undefined) {
      mockInvoke(cmd, args);
    } else {
      mockInvoke(cmd);
    }
    return Promise.resolve();
  },
}));

// Mock tauri event listen
const eventListeners: Record<string, Function> = {};
const mockListen = vi.fn((eventName: string, callback: Function) => {
  eventListeners[eventName] = callback;
  return Promise.resolve(() => {
    delete eventListeners[eventName];
  });
});
vi.mock('@tauri-apps/api/event', () => ({
  listen: (eventName: string, callback: Function) => mockListen(eventName, callback),
}));

// Helper to trigger events
const triggerTauriEvent = (eventName: string, payload?: any) => {
  if (eventListeners[eventName]) {
    act(() => {
      eventListeners[eventName]({ payload });
    });
  }
};

// Helper to wait until Tauri registers a listener to prevent async race conditions
const waitForTauriListener = async (eventName: string) => {
  await waitFor(() => {
    expect(eventListeners[eventName]).toBeDefined();
  });
};

describe('Tauri GUI to Backend Interaction Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Simulate being inside a Tauri environment
    (window as any).__TAURI_INTERNALS__ = {};
    
    // Set matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
    cleanup();
  });

  it('triggers resize and resizability commands on mount based on initial layout', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);
    
    // Large layout is default on fresh start. Large mode: resizable = true, width = 800, height = 600
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_window_resizable', { resizable: true });
      expect(mockInvoke).toHaveBeenCalledWith('resize_window', { width: 800, height: 600 });
    });
  });

  it('triggers resize and locks resizability when switching to Small mode', async () => {
    const { container } = render(<LocaleProvider><App /></LocaleProvider>);

    // Switch to Small mode using frontend switcher
    const smallBtn = await screen.findByText('Małe');
    mockInvoke.mockClear();
    fireEvent.click(smallBtn);

    await waitFor(() => {
      // Small mode: resizable = false, width = 320, height = 480
      expect(mockInvoke).toHaveBeenCalledWith('set_window_resizable', { resizable: false });
      expect(mockInvoke).toHaveBeenCalledWith('resize_window', { width: 320, height: 480 });
    });
  });

  it('triggers resize and enables resizability when switching to Medium mode', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);

    // Switch to Medium mode
    const mediumBtn = await screen.findByText('Średnie');
    mockInvoke.mockClear();
    fireEvent.click(mediumBtn);

    await waitFor(() => {
      // Medium mode: resizable = true, width = 400, height = 600
      expect(mockInvoke).toHaveBeenCalledWith('set_window_resizable', { resizable: true });
      expect(mockInvoke).toHaveBeenCalledWith('resize_window', { width: 400, height: 600 });
    });
  });

  it('updates layout variant state when receiving native window maximize/minimize/restore events', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);

    // Wait for the listeners to register before triggering
    await waitForTauriListener('native-window-minimized');
    await waitForTauriListener('native-window-maximized');
    await waitForTauriListener('native-window-restored');

    // Initially in Large. Trigger native minimize to switch to Small layout.
    triggerTauriEvent('native-window-minimized');
    
    // Verify Small layout is active (it renders top toggle, but no large tabs)
    await screen.findByText('Top');
    expect(screen.queryByTestId('tab-cli')).toBeNull();

    // Trigger native maximize to switch to Large layout.
    triggerTauriEvent('native-window-maximized');
    await screen.findByTestId('tab-cli');

    // Trigger native restore to switch to Medium layout.
    triggerTauriEvent('native-window-restored');
    // In Medium mode, it renders BaseGui inside a condensed view, which doesn't have standard tabs
    await waitFor(() => {
      expect(screen.queryByTestId('tab-cli')).toBeNull();
    });
  });

  it('updates layout variant dynamically based on native window resizing thresholds', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);

    await waitForTauriListener('native-window-resized');

    // Logical width 280 -> Small layout
    triggerTauriEvent('native-window-resized', [280, 280]);
    await screen.findByText('Top');

    // Logical width 450 -> Medium layout
    triggerTauriEvent('native-window-resized', [450, 600]);
    await waitFor(() => {
      expect(screen.queryByText('Top')).toBeNull();
      expect(screen.queryByTestId('tab-cli')).toBeNull();
    });

    // Logical width 700 -> Large layout
    triggerTauriEvent('native-window-resized', [700, 600]);
    await screen.findByTestId('tab-cli');
  });

  it('calls exit_app when close requested and minimizeToTray is false', async () => {
    localStorage.setItem('oxytime_min_to_tray', 'false');
    render(<LocaleProvider><App /></LocaleProvider>);

    await waitForTauriListener('native-close-requested');

    mockInvoke.mockClear();
    triggerTauriEvent('native-close-requested');

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('exit_app');
    });
  });

  it('handles native-close-requested by downsizing to Small if minimizeToTray is true and window is in Large/Medium mode', async () => {
    localStorage.setItem('oxytime_min_to_tray', 'true');
    render(<LocaleProvider><App /></LocaleProvider>);

    await waitForTauriListener('native-close-requested');

    // App is in Large mode initially. Close window native request.
    mockInvoke.mockClear();
    triggerTauriEvent('native-close-requested');

    // Should set guiVariant to small and set alwaysOnTop to false
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_window_resizable', { resizable: false });
      expect(mockInvoke).toHaveBeenCalledWith('resize_window', { width: 320, height: 480 });
      expect(mockInvoke).toHaveBeenCalledWith('set_always_on_top', { alwaysOnTop: false });
    });
  });

  it('handles native-close-requested by calling hide_window if minimizeToTray is true and window is already in Small mode', async () => {
    localStorage.setItem('oxytime_min_to_tray', 'true');
    localStorage.setItem('oxytime_gui_variant', 'small');
    render(<LocaleProvider><App /></LocaleProvider>);

    await waitForTauriListener('native-close-requested');

    // App starts in Small mode. Trigger close.
    mockInvoke.mockClear();
    triggerTauriEvent('native-close-requested');

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('hide_window');
    });
  });
});

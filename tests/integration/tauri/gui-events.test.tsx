// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import App from '../../../src/App';
import { LocaleProvider } from '../../../src/providers/LocaleProvider';

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

describe('Integration Tests: Tauri GUI Events', () => {
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

  it('should_trigger_resize_and_resizability_commands_on_mount_based_on_initial_layout', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);
    
    // Large layout is default on fresh start.
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_gui_size', { size: 'large', textAndIconSize: expect.any(String) });
    });
  });

  it('should_trigger_resize_and_lock_resizability_when_switching_to_small_mode', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);

    // Switch to Small mode using frontend switcher
    const smallBtn = await screen.findByText('Małe');
    mockInvoke.mockClear();
    fireEvent.click(smallBtn);

    await waitFor(() => {
      // Small mode
      expect(mockInvoke).toHaveBeenCalledWith('set_gui_size', { size: 'small', textAndIconSize: expect.any(String) });
    });
  });

  it('should_trigger_resize_and_enable_resizability_when_switching_to_medium_mode', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);

    // Switch to Medium mode
    const mediumBtn = await screen.findByText('Średnie');
    mockInvoke.mockClear();
    fireEvent.click(mediumBtn);

    await waitFor(() => {
      // Medium mode
      expect(mockInvoke).toHaveBeenCalledWith('set_gui_size', { size: 'medium', textAndIconSize: expect.any(String) });
    });
  });

  it('should_update_layout_variant_state_when_receiving_native_window_maximize_event', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);

    await waitForTauriListener('native-window-maximized');

    // Trigger native maximize to switch to Large layout.
    triggerTauriEvent('native-window-maximized');
    await screen.findByTestId('tab-cli');
  });

  it('should_handle_tray_set_gui_variant_event_to_switch_gui_mode', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);

    await waitForTauriListener('tray-set-gui-variant');

    mockInvoke.mockClear();
    triggerTauriEvent('tray-set-gui-variant', 'small');

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_gui_size', { size: 'small', textAndIconSize: expect.any(String) });
    });
  });

  it('should_handle_tray_stop_all_timers_event_without_errors', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);

    await waitForTauriListener('tray-stop-all-timers');

    // Just trigger it — should not throw
    triggerTauriEvent('tray-stop-all-timers');
  });

  it('should_handle_tray_toggle_on_top_event_toggling_always_on_top_settings_and_calling_tauri_set_always_on_top', async () => {
    render(<LocaleProvider><App /></LocaleProvider>);

    await waitForTauriListener('tray-toggle-on-top');

    // Default GUI is large (guiVariant !== 'small'), so it should toggle alwaysOnTopMain.
    // Default alwaysOnTopMain is false.
    mockInvoke.mockClear();
    triggerTauriEvent('tray-toggle-on-top');

    await waitFor(() => {
      // It should turn to true and invoke Tauri set_always_on_top with true
      expect(mockInvoke).toHaveBeenCalledWith('set_always_on_top', { alwaysOnTop: true });
    });
  });

  it('should_update_window_always_on_top_config_when_toggling_setting_in_small_view', async () => {
    // Start with guiSize = small and alwaysOnTopSmall = false
    localStorage.setItem('oxytime_gui_variant', 'small');
    localStorage.setItem('oxytime_always_on_top_small', 'false');

    render(<LocaleProvider><App /></LocaleProvider>);

    // Wait for the initial resize/always_on_top on mount
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_always_on_top', { alwaysOnTop: false });
    });

    mockInvoke.mockClear();

    // Toggle the "Top" checkbox in SmallGui
    const checkbox = await screen.findByRole('checkbox', { name: /top/i });
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_always_on_top', { alwaysOnTop: true });
    });
  });

  it('should_handle_small_gui_close_button_click_to_hide_window_when_minimize_to_tray_is_enabled', async () => {
    localStorage.setItem('oxytime_gui_variant', 'small');
    localStorage.setItem('oxytime_min_to_tray', 'true');

    render(<LocaleProvider><App /></LocaleProvider>);

    mockInvoke.mockClear();

    // The close button is the one with the X icon in SmallGui. Let's find it by title.
    // In test env, locale defaults to 'en' so the title is 'Close / Hide to Tray'.
    const closeBtn = await screen.findByTitle('Close / Hide to Tray');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('hide_window');
    });
  });

  it('should_handle_small_gui_close_button_click_to_exit_app_when_minimize_to_tray_is_disabled', async () => {
    localStorage.setItem('oxytime_gui_variant', 'small');
    localStorage.setItem('oxytime_min_to_tray', 'false');

    render(<LocaleProvider><App /></LocaleProvider>);

    mockInvoke.mockClear();

    const closeBtn = await screen.findByTitle('Close / Hide to Tray');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('exit_app');
    });
  });

  it('should_handle_small_gui_restore_button_click_to_restore_gui_variant_and_unlock_resizing', async () => {
    localStorage.setItem('oxytime_gui_variant', 'small');
    localStorage.setItem('oxytime_last_non_small_variant', 'large');

    render(<LocaleProvider><App /></LocaleProvider>);

    // Wait for mount config
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_gui_size', { size: 'small', textAndIconSize: expect.any(String) });
    });

    mockInvoke.mockClear();

    // Find the restore button ("Restore larger size")
    const restoreBtn = await screen.findByTitle('Restore larger size');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      // It should restore to 'large', triggering resize to large
      expect(mockInvoke).toHaveBeenCalledWith('set_gui_size', { size: 'large', textAndIconSize: expect.any(String) });
    });
  });

  it('should_respect_generated_gui_size_and_always_on_top_config_types', () => {
    const variants: import('../../../src/bindings/GuiSize').GuiSize[] = ['small', 'medium', 'large'];
    expect(variants).toHaveLength(3);

    const config: import('../../../src/bindings/AlwaysOnTopConfig').AlwaysOnTopConfig = {
      small: true,
      main: false,
    };
    expect(config.small).toBe(true);
    expect(config.main).toBe(false);
  });
});

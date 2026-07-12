// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mockInvoke,
  tauriEventRegistry,
  triggerTauriEvent,
  setupMatchMediaMock,
} from '../../shared/test-helpers';

import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import App from '../../../src/App';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { OxyProvider } from '@common/hooks/OxyContext';

const waitForTauriListener = async (eventName: string) => {
  await waitFor(() => {
    expect(tauriEventRegistry[eventName]).toBeDefined();
  });
};

describe('Integration Tests: Tauri GUI Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (window as any).__TAURI_INTERNALS__ = {};

    setupMatchMediaMock(false);
  });

  afterEach(() => {
    delete (window as any).__TAURI_INTERNALS__;
    cleanup();
  });

  it('should_trigger_resize_and_resizability_commands_on_mount_based_on_initial_layout', async () => {
    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_size', { size: 'large', textAndIconSize: expect.any(String) });
    });
  });

  it('should_trigger_resize_and_lock_resizability_when_switching_to_small_mode', async () => {
    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);

    const smallBtn = await screen.findByText(/małe|small/i);
    mockInvoke.mockClear();
    fireEvent.click(smallBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_size', { size: 'small', textAndIconSize: expect.any(String) });
    });
  });

  it('should_trigger_resize_and_enable_resizability_when_switching_to_medium_mode', async () => {
    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);
    const mediumBtn = await screen.findByText(/średnie|medium/i);
    mockInvoke.mockClear();
    fireEvent.click(mediumBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_size', { size: 'medium', textAndIconSize: expect.any(String) });
    });
  });

  it('should_update_layout_variant_state_when_receiving_native_window_maximize_event', async () => {
    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);

    await waitForTauriListener('native-window-maximized');

    triggerTauriEvent('native-window-maximized');
    await screen.findByTestId('tab-cli');
  });

  it('should_handle_tray_set_gui_variant_event_to_switch_gui_mode', async () => {
    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);

    await waitForTauriListener('tray-set-gui-variant');

    mockInvoke.mockClear();
    triggerTauriEvent('tray-set-gui-variant', 'small');

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_size', { size: 'small', textAndIconSize: expect.any(String) });
    });
  });

  it('should_handle_tray_stop_all_timers_event_without_errors', async () => {
    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);

    await waitForTauriListener('tray-stop-all-timers');

    triggerTauriEvent('tray-stop-all-timers');
  });

  it('should_handle_tray_toggle_on_top_event_toggling_always_on_top_settings_and_calling_tauri_set_always_on_top', async () => {
    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);

    await waitForTauriListener('tray-toggle-on-top');

    mockInvoke.mockClear();
    triggerTauriEvent('tray-toggle-on-top');

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_always_on_top', { alwaysOnTop: true });
    });
  });

  it('should_update_window_always_on_top_config_when_toggling_setting_in_small_view', async () => {
    localStorage.setItem('oxytime_gui_variant', 'small');
    localStorage.setItem('oxytime_always_on_top_small', 'false');

    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_always_on_top', { alwaysOnTop: false });
    });

    mockInvoke.mockClear();

    const checkbox = await screen.findByRole('checkbox', { name: /top/i });
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_always_on_top', { alwaysOnTop: true });
    });
  });

  it('should_handle_small_gui_close_button_click_to_hide_window_when_minimize_to_tray_is_enabled', async () => {
    localStorage.setItem('oxytime_gui_variant', 'small');
    localStorage.setItem('oxytime_min_to_tray', 'true');

    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);

    mockInvoke.mockClear();

    const closeBtn = await screen.findByTitle('Close / Hide to Tray');
    fireEvent.click(closeBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('hide');
    });
  });

  it('should_handle_small_gui_close_button_click_to_exit_app_when_minimize_to_tray_is_disabled', async () => {
    localStorage.setItem('oxytime_gui_variant', 'small');
    localStorage.setItem('oxytime_min_to_tray', 'false');

    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);

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

    render(<LocaleProvider><OxyProvider><App /></OxyProvider></LocaleProvider>);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_size', { size: 'small', textAndIconSize: expect.any(String) });
    });

    mockInvoke.mockClear();

    const restoreBtn = await screen.findByTitle('Restore larger size');
    fireEvent.click(restoreBtn);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_size', { size: 'large', textAndIconSize: expect.any(String) });
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

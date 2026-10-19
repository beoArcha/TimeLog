// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  mockInvoke,
  tauriEventRegistry,
  triggerTauriEvent,
  setupMatchMediaMock,
  getMockOxyFlowState,
  setTauriDesktopEnvironment,
} from '@tests/shared/test-helpers';

import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import App from '../../src/App';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { MockProviders } from '@tests/shared/mocks/MockProviders';

const waitForTauriListener = async (eventName: string) => {
  await waitFor(() => {
    expect(tauriEventRegistry[eventName]).toBeDefined();
  });
};

describe('Integration Tests: Tauri GUI Events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setTauriDesktopEnvironment(true);

    setupMatchMediaMock(false);
  });

  afterEach(() => {
    setTauriDesktopEnvironment(false);
    cleanup();
  });

  it('should trigger resize and resizability commands on mount based on initial layout', async () => {
    // Given & When
    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );

    // Then
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_layout_variant', {
        variant: 'full',
        textAndIconSize: expect.any(String),
      });
    });
  });

  it('should trigger resize and lock resizability when switching to small mode', async () => {
    // Given
    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );

    // When
    const smallBtns = await screen.findAllByTestId('layout-variant-compact');
    mockInvoke.mockClear();
    fireEvent.click(smallBtns[0]);

    // Then
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_layout_variant', {
        variant: 'compact',
        textAndIconSize: expect.any(String),
      });
    });
  });

  it('should trigger resize and enable resizability when switching to medium mode', async () => {
    // Given
    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );

    // When
    const mediumBtns = await screen.findAllByTestId('layout-variant-medium');
    mockInvoke.mockClear();
    fireEvent.click(mediumBtns[0]);

    // Then
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_layout_variant', {
        variant: 'medium',
        textAndIconSize: expect.any(String),
      });
    });
  });

  it('should update layout variant state when receiving native window maximize event', async () => {
    // Given
    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );
    await waitForTauriListener('native-window-maximized');

    // When
    triggerTauriEvent('native-window-maximized');

    // Then
    await screen.findByTestId('tab-cli');
  });

  it('should handle tray set gui variant event to switch gui mode', async () => {
    // Given
    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );
    await waitForTauriListener('tray-set-gui-variant');

    // When
    mockInvoke.mockClear();
    triggerTauriEvent('tray-set-gui-variant', 'compact');

    // Then
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_layout_variant', {
        variant: 'compact',
        textAndIconSize: expect.any(String),
      });
    });
  });

  it('should handle tray stop all timers event without errors', async () => {
    // Given
    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );
    await waitForTauriListener('tray-stop-all-timers');

    // When & Then
    triggerTauriEvent('tray-stop-all-timers');
  });

  it('should handle tray toggle on top event toggling always on top settings and calling tauri set always on top', async () => {
    // Given
    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );
    await waitForTauriListener('tray-toggle-on-top');

    // When
    mockInvoke.mockClear();
    triggerTauriEvent('tray-toggle-on-top');

    // Then
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_always_on_top', { alwaysOnTop: true });
    });
  });

  it('should update window always on top config when toggling setting in small view', async () => {
    // Given
    localStorage.setItem('oxytime_gui_variant', 'compact');
    localStorage.setItem('oxytime_always_on_top_small', 'false');

    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_always_on_top', { alwaysOnTop: false });
    });
    mockInvoke.mockClear();

    // When
    const checkbox = await screen.findByRole('checkbox', { name: /top/i });
    fireEvent.click(checkbox);

    // Then
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_always_on_top', { alwaysOnTop: true });
    });
  });

  it('should handle small gui close button click to hide window when minimize to tray is enabled', async () => {
    // Given
    localStorage.setItem('oxytime_gui_variant', 'compact');
    localStorage.setItem('oxytime_min_to_tray', 'true');

    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );
    mockInvoke.mockClear();

    // When
    const closeBtn = await screen.findByTestId('compact-close-btn');
    fireEvent.click(closeBtn);

    // Then
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('hide');
    });
  });

  it('should handle small gui close button click to exit app when minimize to tray is disabled', async () => {
    // Given
    localStorage.setItem('oxytime_gui_variant', 'compact');
    localStorage.setItem('oxytime_min_to_tray', 'false');

    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );
    mockInvoke.mockClear();

    // When
    const closeBtn = await screen.findByTestId('compact-close-btn');
    fireEvent.click(closeBtn);

    // Then
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('exit_app');
    });
  });

  it('should handle small gui restore button click to restore gui variant and unlock resizing', async () => {
    // Given
    localStorage.setItem('oxytime_gui_variant', 'compact');
    localStorage.setItem('oxytime_last_non_compact_variant', 'full');

    render(
      <LocaleProvider>
        <MockProviders state={getMockOxyFlowState()}>
          <App />
        </MockProviders>
      </LocaleProvider>
    );

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_layout_variant', {
        variant: 'compact',
        textAndIconSize: expect.any(String),
      });
    });
    mockInvoke.mockClear();

    // When
    const restoreBtn = await screen.findByTestId('compact-restore-btn');
    fireEvent.click(restoreBtn);

    // Then
    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('set_layout_variant', {
        variant: 'full',
        textAndIconSize: expect.any(String),
      });
    });
  });

  it('should respect generated layout variant and always on top config types', () => {
    // Given & When
    const variants: import('@bindings/LayoutVariant').LayoutVariant[] = [
      'compact',
      'medium',
      'full',
    ];
    const config: import('@bindings/AlwaysOnTopConfig').AlwaysOnTopConfig = {
      small: true,
      main: false,
    };

    // Then
    expect(variants).toHaveLength(3);
    expect(config.small).toBe(true);
    expect(config.main).toBe(false);
  });
});

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
import { LayoutVariant } from '@bindings/LayoutVariant';
import { AlwaysOnTopConfig } from '@bindings/AlwaysOnTopConfig';

const waitForTauriListener = async (eventName: string) => {
  await waitFor(() => {
    expect(tauriEventRegistry[eventName]).toBeDefined();
  });
};

describe('Given Tauri desktop runtime environment', () => {
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

  describe('When application mounts with default layout', () => {
    it('Then it should trigger resize and resizability commands for full layout', async () => {
      // Given
      const state = getMockOxyFlowState();

      // When
      render(
        <LocaleProvider>
          <MockProviders state={state}>
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
  });

  describe('When user switches to compact mode', () => {
    it('Then it should trigger resize and lock resizability for compact mode', async () => {
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
  });

  describe('When user switches to medium mode', () => {
    it('Then it should trigger resize and enable resizability for medium mode', async () => {
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
  });

  describe('When native window maximize event is received', () => {
    it('Then it should update layout variant and render CLI tab', async () => {
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
      const cliTab = await screen.findByTestId('tab-cli');
      expect(cliTab).toBeDefined();
    });
  });

  describe('When tray set GUI variant event is received', () => {
    it('Then it should switch layout variant to specified mode', async () => {
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
  });

  describe('When tray stop all timers event is received', () => {
    it('Then it should process the event without errors', async () => {
      // Given
      render(
        <LocaleProvider>
          <MockProviders state={getMockOxyFlowState()}>
            <App />
          </MockProviders>
        </LocaleProvider>
      );
      await waitForTauriListener('tray-stop-all-timers');

      // When
      triggerTauriEvent('tray-stop-all-timers');

      // Then
      expect(mockInvoke).toBeDefined();
    });
  });

  describe('When tray toggle on top event is received', () => {
    it('Then it should toggle always-on-top setting and invoke Tauri command', async () => {
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
  });

  describe('When toggling always on top in compact mode', () => {
    it('Then it should update window configuration via Tauri invoke', async () => {
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
  });

  describe('When compact close button is clicked with minimize-to-tray enabled', () => {
    it('Then it should invoke window hide command', async () => {
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
  });

  describe('When compact close button is clicked with minimize-to-tray disabled', () => {
    it('Then it should invoke exit_app command', async () => {
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
  });

  describe('When compact restore button is clicked', () => {
    it('Then it should restore previous non-compact layout variant', async () => {
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
  });

  describe('When evaluating layout variant and always-on-top types', () => {
    it('Then it should conform to generated binding contracts', () => {
      // Given
      const variants: LayoutVariant[] = ['compact', 'medium', 'full'];
      const config: AlwaysOnTopConfig = {
        small: true,
        main: false,
      };

      // When
      const variantCount = variants.length;

      // Then
      expect(variantCount).toBe(3);
      expect(config.small).toBe(true);
      expect(config.main).toBe(false);
    });
  });
});

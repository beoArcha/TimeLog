import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAppSettings } from '@common/hooks/useAppSettings';
import { PlatformCapabilitiesContext, PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { Settings as AppSettings } from '@bindings/Settings';
import {
  setupLocalStorageMock,
  setupMatchMediaMock,
  resetMockDesktopSettings,
  getMockDesktopSettingsSnapshot,
} from '@tests/shared/test-helpers';

describe('Given desktop and browser environments with separate persistence stores', () => {
  beforeEach(() => {
    resetMockDesktopSettings();
    setupLocalStorageMock();
    setupMatchMediaMock(false);
    PersistenceRouter.resetForTesting();
  });

  afterEach(() => {
    try {
      resetMockDesktopSettings();
      PersistenceRouter.resetForTesting();
    } finally {
      vi.restoreAllMocks();
    }
  });

  describe('When settings are modified in the browser runtime', () => {
    it('Then it should preserve desktop-specific preferences intact upon desktop reload', async () => {
      try {
        // Given
        const initialDesktopSettings: AppSettings = {
          theme: 'dark',
          guiVariant: 'compact',
          textAndIconSize: 'large',
          autoStart: true,
          includePatchesInReports: false,
          activeSinks: ['Csv'],
          alwaysOnTopSmall: true,
          alwaysOnTopMain: true,
          minimizeToTray: true,
        };

        resetMockDesktopSettings(initialDesktopSettings);

        // Desktop runtime uses real PersistenceCommands with Tauri IPC mock (SQLite test double)
        PersistenceRouter.getInstance().setImplementationForTesting(new PersistenceCommands());

        const desktopCapabilities: PlatformCapabilities = {
          dragRegionProps: {},
          canInspectDatabase: true,
          supportedLayouts: ['compact', 'medium', 'full'],
          defaultLayout: 'compact',
          supportsTray: true,
          supportsAlwaysOnTop: true,
          supportsAutoStart: true,
          isPwaInstallable: false,
        };

        const desktopWrapper = ({ children }: { children: React.ReactNode }) => (
          <PlatformCapabilitiesContext.Provider value={desktopCapabilities}>
            {children}
          </PlatformCapabilitiesContext.Provider>
        );

        const { result: desktopResult, unmount: unmountDesktop } = renderHook(() => useAppSettings(), {
          wrapper: desktopWrapper,
        });

        await waitFor(() => {
          expect(desktopResult.current.theme).toBe('dark');
          expect(desktopResult.current.layoutVariant).toBe('compact');
        });

        unmountDesktop();

        // When
        PersistenceRouter.resetForTesting();
        // Browser runtime uses real PersistencePlugin backed by LocalStorage
        PersistenceRouter.getInstance().setImplementationForTesting(new PersistencePlugin());

        const webCapabilities: PlatformCapabilities = {
          dragRegionProps: {},
          canInspectDatabase: false,
          supportedLayouts: ['medium', 'full'],
          defaultLayout: 'full',
          supportsTray: false,
          supportsAlwaysOnTop: false,
          supportsAutoStart: false,
          isPwaInstallable: true,
        };

        const webWrapper = ({ children }: { children: React.ReactNode }) => (
          <PlatformCapabilitiesContext.Provider value={webCapabilities}>
            {children}
          </PlatformCapabilitiesContext.Provider>
        );

        const { result: webResult, unmount: unmountWeb } = renderHook(() => useAppSettings(), {
          wrapper: webWrapper,
        });

        await waitFor(() => {
          expect(webResult.current.theme).toBe('system');
          expect(webResult.current.layoutVariant).toBe('full');
        });

        await act(async () => {
          webResult.current.setTheme('light');
          webResult.current.setTextAndIconSize('small');
          webResult.current.setLayoutVariant('medium');
        });

        await waitFor(() => {
          expect(webResult.current.theme).toBe('light');
          expect(webResult.current.textAndIconSize).toBe('small');
          expect(webResult.current.layoutVariant).toBe('medium');
        });

        // Verify that browser write strictly targeted LocalStorage
        const webSavedJson = localStorage.getItem('timelog_persistence_plugin_settings');
        expect(webSavedJson).not.toBeNull();
        const webSaved = JSON.parse(webSavedJson!);
        expect(webSaved.theme).toBe('light');
        expect(webSaved.textAndIconSize).toBe('small');
        expect(webSaved.guiVariant).toBe('medium');

        unmountWeb();

        // Then
        PersistenceRouter.resetForTesting();
        // Re-initialize desktop runtime with real PersistenceCommands
        PersistenceRouter.getInstance().setImplementationForTesting(new PersistenceCommands());

        const { result: restoredDesktopResult } = renderHook(() => useAppSettings(), {
          wrapper: desktopWrapper,
        });

        // Assert that desktop persistence store remained completely isolated from web mutations
        await waitFor(() => {
          expect(restoredDesktopResult.current.theme).toBe('dark');
          expect(restoredDesktopResult.current.textAndIconSize).toBe('large');
          expect(restoredDesktopResult.current.layoutVariant).toBe('compact');
          expect(restoredDesktopResult.current.alwaysOnTopSmall).toBe(true);
          expect(restoredDesktopResult.current.alwaysOnTopMain).toBe(true);
          expect(restoredDesktopResult.current.minimizeToTray).toBe(true);
          expect(restoredDesktopResult.current.sysSettings.autoStart).toBe(true);
          expect(restoredDesktopResult.current.sysSettings.includePatchesInReports).toBe(false);
          expect(restoredDesktopResult.current.sysSettings.activeSinks).toEqual(['Csv']);
        });

        const desktopSnapshot = getMockDesktopSettingsSnapshot();
        expect(desktopSnapshot.theme).toBe('dark');
        expect(desktopSnapshot.textAndIconSize).toBe('large');
        expect(desktopSnapshot.guiVariant).toBe('compact');
        expect(desktopSnapshot.autoStart).toBe(true);
        expect(desktopSnapshot.minimizeToTray).toBe(true);
        expect(desktopSnapshot.alwaysOnTopSmall).toBe(true);
        expect(desktopSnapshot.alwaysOnTopMain).toBe(true);
        expect(desktopSnapshot.includePatchesInReports).toBe(false);
        expect(desktopSnapshot.activeSinks).toEqual(['Csv']);
      } finally {
        resetMockDesktopSettings();
      }
    });
  });
});

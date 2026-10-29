import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAppSettings } from '@common/hooks/useAppSettings';
import { PlatformCapabilitiesContext, PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { ISettingsPersistence } from '@common/persistence/IPersistence';
import { Settings as AppSettings } from '@bindings/Settings';
import { setupLocalStorageMock, setupMatchMediaMock } from '@tests/shared/test-helpers';

class DesktopSettingsStorageDouble implements ISettingsPersistence {
  private store: AppSettings;

  constructor(initialSettings: AppSettings) {
    this.store = { ...initialSettings };
  }

  async get(): Promise<AppSettings> {
    return { ...this.store };
  }

  async save(settings: AppSettings): Promise<void> {
    this.store = { ...settings };
  }

  getSnapshot(): AppSettings {
    return { ...this.store };
  }
}

describe('Given desktop and browser environments with separate persistence stores', () => {
  const originalTauriInternals = (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;

  beforeEach(() => {
    setupLocalStorageMock();
    setupMatchMediaMock(false);
    PersistenceRouter.resetForTesting();
  });

  afterEach(() => {
    PersistenceRouter.resetForTesting();
    if (originalTauriInternals !== undefined) {
      (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__ = originalTauriInternals;
    } else {
      delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    }
    vi.restoreAllMocks();
  });

  describe('When settings are modified in the browser runtime', () => {
    it('Then it should preserve desktop-specific preferences intact upon desktop reload', async () => {
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

      const desktopStorage = new DesktopSettingsStorageDouble(initialDesktopSettings);
      const desktopPersistence = new PersistenceCommands({ settings: desktopStorage });

      PersistenceRouter.getInstance().setImplementationForTesting(desktopPersistence);

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
      const webPersistence = new PersistencePlugin();
      PersistenceRouter.getInstance().setImplementationForTesting(webPersistence);

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

      unmountWeb();

      // Then
      PersistenceRouter.resetForTesting();
      PersistenceRouter.getInstance().setImplementationForTesting(
        new PersistenceCommands({ settings: desktopStorage })
      );

      const { result: restoredDesktopResult } = renderHook(() => useAppSettings(), {
        wrapper: desktopWrapper,
      });

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

      const desktopSnapshot = desktopStorage.getSnapshot();
      expect(desktopSnapshot.theme).toBe('dark');
      expect(desktopSnapshot.textAndIconSize).toBe('large');
      expect(desktopSnapshot.guiVariant).toBe('compact');
      expect(desktopSnapshot.autoStart).toBe(true);
      expect(desktopSnapshot.minimizeToTray).toBe(true);
      expect(desktopSnapshot.alwaysOnTopSmall).toBe(true);
      expect(desktopSnapshot.alwaysOnTopMain).toBe(true);
      expect(desktopSnapshot.includePatchesInReports).toBe(false);
      expect(desktopSnapshot.activeSinks).toEqual(['Csv']);
    });
  });
});

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

/**
 * Explicit test double representing the Desktop (Tauri IPC / SQLite) settings store.
 * Operates in isolated memory, completely separate from browser LocalStorage.
 */
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

describe('Integration Tests: Cross-Runtime Persistence Boundary (Desktop <-> Web)', () => {
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

  it('proves that Web runtime settings mutations cannot corrupt or overwrite Desktop persistence store', async () => {
    // ------------------------------------------------------------------------------------
    // 1. DESKTOP RUNTIME SESSION
    // ------------------------------------------------------------------------------------
    // The desktop runtime communicates through Tauri IPC / SQLite persistence (PersistenceCommands).
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

    // Configure PersistenceRouter for Desktop runtime
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

    // Mount in Desktop environment
    const { result: desktopResult, unmount: unmountDesktop } = renderHook(() => useAppSettings(), {
      wrapper: desktopWrapper,
    });

    await waitFor(() => {
      expect(desktopResult.current.theme).toBe('dark');
      expect(desktopResult.current.layoutVariant).toBe('compact');
      expect(desktopResult.current.textAndIconSize).toBe('large');
      expect(desktopResult.current.alwaysOnTopSmall).toBe(true);
      expect(desktopResult.current.alwaysOnTopMain).toBe(true);
      expect(desktopResult.current.minimizeToTray).toBe(true);
      expect(desktopResult.current.sysSettings.autoStart).toBe(true);
      expect(desktopResult.current.sysSettings.includePatchesInReports).toBe(false);
      expect(desktopResult.current.sysSettings.activeSinks).toEqual(['Csv']);
    });

    unmountDesktop();

    // ------------------------------------------------------------------------------------
    // 2. WEB RUNTIME SESSION (Browser / PWA)
    // ------------------------------------------------------------------------------------
    // Switch runtime to Web: PersistenceRouter uses browser LocalStorage (PersistencePlugin)
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

    // Web runtime boots with web defaults (clean LocalStorage)
    await waitFor(() => {
      expect(webResult.current.theme).toBe('system');
      expect(webResult.current.layoutVariant).toBe('full');
    });

    // User performs modifications in Web runtime
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

    // Verify LocalStorage received Web settings
    const webSavedJson = localStorage.getItem('timelog_persistence_plugin_settings');
    expect(webSavedJson).not.toBeNull();
    const webSaved = JSON.parse(webSavedJson!);
    expect(webSaved.theme).toBe('light');
    expect(webSaved.textAndIconSize).toBe('small');
    expect(webSaved.guiVariant).toBe('medium');

    unmountWeb();

    // ------------------------------------------------------------------------------------
    // 3. RE-LAUNCH DESKTOP RUNTIME (Desktop Boundary Verification)
    // ------------------------------------------------------------------------------------
    // Re-launch Desktop runtime: PersistenceRouter reconnects to DesktopCommands / desktopStorage
    PersistenceRouter.resetForTesting();
    PersistenceRouter.getInstance().setImplementationForTesting(
      new PersistenceCommands({ settings: desktopStorage })
    );

    const { result: restoredDesktopResult } = renderHook(() => useAppSettings(), {
      wrapper: desktopWrapper,
    });

    // Assert that Desktop state was COMPLETELY ISOLATED and uncorrupted by Web operations
    await waitFor(() => {
      // 1. Theme remains desktop's value ('dark', not web's 'light')
      expect(restoredDesktopResult.current.theme).toBe('dark');
      // 2. textAndIconSize remains desktop's value ('large', not web's 'small')
      expect(restoredDesktopResult.current.textAndIconSize).toBe('large');
      // 3. layoutVariant remains desktop's value ('compact', not web's 'medium')
      expect(restoredDesktopResult.current.layoutVariant).toBe('compact');
      // 4. Desktop-specific flags remained completely untouched
      expect(restoredDesktopResult.current.alwaysOnTopSmall).toBe(true);
      expect(restoredDesktopResult.current.alwaysOnTopMain).toBe(true);
      expect(restoredDesktopResult.current.minimizeToTray).toBe(true);
      expect(restoredDesktopResult.current.sysSettings.autoStart).toBe(true);
      expect(restoredDesktopResult.current.sysSettings.includePatchesInReports).toBe(false);
      expect(restoredDesktopResult.current.sysSettings.activeSinks).toEqual(['Csv']);
    });

    // Verify underlying desktop storage snapshot
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

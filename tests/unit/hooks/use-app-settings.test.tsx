import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAppSettings } from '@common/hooks/useAppSettings';
import { PlatformCapabilitiesContext, PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { setupLocalStorageMock, setupMatchMediaMock } from '@tests/shared/test-helpers';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { ISettingsPersistence } from '@common/persistence/IPersistence';
import { Settings as AppSettings } from '@bindings/Settings';

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

describe('Unit Tests: useAppSettings Hook', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    setupMatchMediaMock(false);
    PersistenceRouter.resetForTesting();
  });

  afterEach(() => {
    PersistenceRouter.resetForTesting();
    vi.restoreAllMocks();
  });

  it('should load saved settings when initialized', async () => {
    // Arrange
    localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify({
      theme: 'light',
      guiVariant: 'medium',
      textAndIconSize: 'medium',
      autoStart: false,
      includePatchesInReports: true,
      activeSinks: ['Csv'],
      alwaysOnTopSmall: false,
      alwaysOnTopMain: false,
      minimizeToTray: true,
    }));

    // Act
    const { result } = renderHook(() => useAppSettings());

    // Assert
    await waitFor(() => {
      expect(result.current.theme).toBe('light');
    });
    expect(result.current.layoutVariant).toBe('medium');
  });

  it('should fallback to defaultLayout when loaded layout is unsupported in current platform', async () => {
    // Arrange
    localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify({
      theme: 'dark',
      guiVariant: 'compact',
      textAndIconSize: 'medium',
      autoStart: false,
      includePatchesInReports: true,
      activeSinks: ['Csv'],
      alwaysOnTopSmall: false,
      alwaysOnTopMain: false,
      minimizeToTray: false,
    }));

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

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlatformCapabilitiesContext.Provider value={webCapabilities}>
        {children}
      </PlatformCapabilitiesContext.Provider>
    );

    // Act
    const { result } = renderHook(() => useAppSettings(), { wrapper });

    // Assert
    await waitFor(() => {
      expect(result.current.theme).toBe('dark');
    });
    expect(result.current.layoutVariant).toBe('full');
  });

  it('should ignore setting an unsupported layout variant', async () => {
    // Arrange
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

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlatformCapabilitiesContext.Provider value={webCapabilities}>
        {children}
      </PlatformCapabilitiesContext.Provider>
    );

    const { result } = renderHook(() => useAppSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.layoutVariant).toBe('full');
    });

    // Act: try setting compact, which is not supported in webCapabilities
    act(() => {
      result.current.setLayoutVariant('compact');
    });

    // Assert
    expect(result.current.layoutVariant).toBe('full');

    // Act: setting medium should succeed
    act(() => {
      result.current.setLayoutVariant('medium');
    });

    // Assert
    expect(result.current.layoutVariant).toBe('medium');
  });

  it('should update localStorage when textAndIconSize changes', async () => {
    // Arrange
    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.textAndIconSize).toBeTruthy();
    });

    // Act
    await act(async () => {
      result.current.setTextAndIconSize('large');
    });

    // Assert
    expect(result.current.textAndIconSize).toBe('large');
  });

  it('should resolve theme correctly when system theme is queried', async () => {
    // Arrange
    setupMatchMediaMock(true);

    const { result } = renderHook(() => useAppSettings());

    await waitFor(() => {
      expect(result.current.resolvedTheme).toBeTruthy();
    });

    // Act
    await act(async () => {
      result.current.setTheme('system');
    });

    // Assert
    expect(result.current.resolvedTheme).toBe('light');
  });

  it('should preserve desktop-specific preferences when settings are updated in browser runtime across actual persistence boundaries', async () => {
    // ------------------------------------------------------------------------------------
    // 1. DESKTOP RUNTIME SESSION
    // ------------------------------------------------------------------------------------
    // The desktop runtime uses PersistenceCommands backed by a dedicated SQLite/IPC store
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
    PersistenceRouter.getInstance().setImplementationForTesting(
      new PersistenceCommands({ settings: desktopStorage })
    );

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
    // 2. BROWSER RUNTIME SESSION (PersistencePlugin with LocalStorage)
    // ------------------------------------------------------------------------------------
    PersistenceRouter.resetForTesting();
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

    // Act: Update web-supported settings in browser
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

    // Assert: Web settings are stored in LocalStorage
    const savedInBrowser = JSON.parse(
      localStorage.getItem('timelog_persistence_plugin_settings') || '{}'
    );
    expect(savedInBrowser.theme).toBe('light');
    expect(savedInBrowser.textAndIconSize).toBe('small');
    expect(savedInBrowser.guiVariant).toBe('medium');

    unmountWeb();

    // ------------------------------------------------------------------------------------
    // 3. RE-LAUNCH DESKTOP RUNTIME SESSION
    // ------------------------------------------------------------------------------------
    PersistenceRouter.resetForTesting();
    PersistenceRouter.getInstance().setImplementationForTesting(
      new PersistenceCommands({ settings: desktopStorage })
    );

    const { result: restoredDesktopResult } = renderHook(() => useAppSettings(), {
      wrapper: desktopWrapper,
    });

    // Assert: Desktop persistence store was completely isolated and retained all preferences
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

    const snapshot = desktopStorage.getSnapshot();
    expect(snapshot.theme).toBe('dark');
    expect(snapshot.textAndIconSize).toBe('large');
    expect(snapshot.guiVariant).toBe('compact');
    expect(snapshot.autoStart).toBe(true);
    expect(snapshot.minimizeToTray).toBe(true);
    expect(snapshot.alwaysOnTopSmall).toBe(true);
    expect(snapshot.alwaysOnTopMain).toBe(true);
    expect(snapshot.includePatchesInReports).toBe(false);
    expect(snapshot.activeSinks).toEqual(['Csv']);
  });

  it('should ignore stale async promise resolutions when effect unmounts or cancels', async () => {
    // Arrange: Create a deferred promise that resolves slowly
    let resolveStalePromise!: (val: AppSettings) => void;
    const stalePromise = new Promise<AppSettings>((resolve) => {
      resolveStalePromise = resolve;
    });

    const getSpy = vi.spyOn(PersistenceRouter.getInstance().settings, 'get').mockImplementation(() => {
      return stalePromise;
    });

    // Act: Mount and immediately unmount hook
    const { unmount } = renderHook(() => useAppSettings());
    unmount();

    // Now resolve the stale promise after unmount
    resolveStalePromise({
      theme: 'light',
      guiVariant: 'full',
      textAndIconSize: 'large',
      autoStart: false,
      includePatchesInReports: true,
      activeSinks: ['Csv'],
      alwaysOnTopSmall: false,
      alwaysOnTopMain: false,
      minimizeToTray: false,
    });

    // Allow any pending microtasks to flush
    await new Promise((r) => setTimeout(r, 20));

    getSpy.mockRestore();
  });

  it('should prevent stale out-of-order async reads from overwriting newer state', async () => {
    // Arrange: Two deferred promises for settings.get(): P1 (first read) and P2 (second read)
    let resolveP1!: (val: AppSettings) => void;
    const p1 = new Promise<AppSettings>((resolve) => {
      resolveP1 = resolve;
    });

    let resolveP2!: (val: AppSettings) => void;
    const p2 = new Promise<AppSettings>((resolve) => {
      resolveP2 = resolve;
    });

    let callCount = 0;
    const getSpy = vi.spyOn(PersistenceRouter.getInstance().settings, 'get').mockImplementation(() => {
      callCount++;
      return callCount === 1 ? p1 : p2;
    });

    const initialCapabilities: PlatformCapabilities = {
      dragRegionProps: {},
      canInspectDatabase: false,
      supportedLayouts: ['compact', 'medium', 'full'],
      defaultLayout: 'full',
      supportsTray: true,
      supportsAlwaysOnTop: true,
      supportsAutoStart: true,
      isPwaInstallable: false,
    };

    const updatedCapabilities: PlatformCapabilities = {
      ...initialCapabilities,
      supportedLayouts: ['medium', 'full'],
      defaultLayout: 'medium',
    };

    let currentCapabilities = initialCapabilities;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlatformCapabilitiesContext.Provider value={currentCapabilities}>
        {children}
      </PlatformCapabilitiesContext.Provider>
    );

    // Act 1: Mount with initial capabilities -> triggers Read 1 (P1)
    const { result, rerender } = renderHook(() => useAppSettings(), { wrapper });
    expect(callCount).toBe(1);

    // Act 2: Change capabilities to trigger Read 2 (P2)
    currentCapabilities = updatedCapabilities;
    rerender();
    expect(callCount).toBe(2);

    // Act 3: Resolve P2 first with theme = 'light'
    resolveP2({
      theme: 'light',
      guiVariant: 'medium',
      textAndIconSize: 'medium',
      autoStart: false,
      includePatchesInReports: true,
      activeSinks: ['Csv'],
      alwaysOnTopSmall: false,
      alwaysOnTopMain: false,
      minimizeToTray: false,
    });

    await waitFor(() => {
      expect(result.current.theme).toBe('light');
      expect(result.current.layoutVariant).toBe('medium');
    });

    // Act 4: Resolve P1 second with stale theme = 'dark' and layout = 'compact'
    resolveP1({
      theme: 'dark',
      guiVariant: 'compact',
      textAndIconSize: 'small',
      autoStart: true,
      includePatchesInReports: true,
      activeSinks: ['Csv'],
      alwaysOnTopSmall: true,
      alwaysOnTopMain: true,
      minimizeToTray: true,
    });

    // Flush microtasks
    await new Promise((r) => setTimeout(r, 25));

    // Assert: P1's stale resolution was cancelled and must NOT overwrite P2's values
    expect(result.current.theme).toBe('light');
    expect(result.current.layoutVariant).toBe('medium');

    getSpy.mockRestore();
  });
});

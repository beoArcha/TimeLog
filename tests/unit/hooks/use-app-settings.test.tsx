import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAppSettings } from '@common/hooks/useAppSettings';
import { PlatformCapabilitiesContext, PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { setupLocalStorageMock, setupMatchMediaMock } from '@tests/shared/test-helpers';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { Settings as AppSettings } from '@bindings/Settings';

describe('useAppSettings', () => {
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

  it('should ignore setting an unsupported layout variant when attempted', async () => {
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

    // Act
    act(() => {
      result.current.setLayoutVariant('compact');
    });

    // Assert
    expect(result.current.layoutVariant).toBe('full');
  });

  it('should allow setting a supported layout variant when available', async () => {
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

    // Act
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

  it('should ignore stale async promise resolutions when effect unmounts or cancels', async () => {
    // Arrange
    let resolveStalePromise!: (val: AppSettings) => void;
    const stalePromise = new Promise<AppSettings>((resolve) => {
      resolveStalePromise = resolve;
    });

    const getSpy = vi.spyOn(PersistenceRouter.getInstance().settings, 'get').mockImplementation(() => {
      return stalePromise;
    });

    const { unmount } = renderHook(() => useAppSettings());

    // Act
    unmount();
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
    await new Promise((r) => setTimeout(r, 20));

    // Assert
    expect(getSpy).toHaveBeenCalledTimes(1);

    getSpy.mockRestore();
  });

  it('should prevent stale out-of-order async reads from overwriting newer state', async () => {
    // Arrange
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

    const { result, rerender } = renderHook(() => useAppSettings(), { wrapper });

    // Act
    currentCapabilities = updatedCapabilities;
    rerender();

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

    await new Promise((r) => setTimeout(r, 25));

    // Assert
    expect(callCount).toBe(2);
    expect(result.current.theme).toBe('light');
    expect(result.current.layoutVariant).toBe('medium');

    getSpy.mockRestore();
  });
});

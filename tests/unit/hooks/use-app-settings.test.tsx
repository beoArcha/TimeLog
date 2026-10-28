import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppSettings } from '@common/hooks/useAppSettings';
import { PlatformCapabilitiesContext, PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { setupLocalStorageMock, setupMatchMediaMock } from '@tests/shared/test-helpers';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { Settings as AppSettings } from '@bindings/Settings';

describe('Unit Tests: useAppSettings Hook', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    setupMatchMediaMock(false);
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

  it('should preserve desktop-specific preferences when settings are updated in browser runtime', async () => {
    // Arrange: Seed persistence with desktop preferences
    const initialSettings = {
      theme: 'dark',
      guiVariant: 'medium',
      textAndIconSize: 'medium',
      autoStart: true,
      includePatchesInReports: true,
      activeSinks: ['Csv'],
      alwaysOnTopSmall: true,
      alwaysOnTopMain: true,
      minimizeToTray: true,
    };
    localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify(initialSettings));

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
      expect(result.current.theme).toBe('dark');
    });

    // Act: update theme in browser
    await act(async () => {
      result.current.setTheme('light');
    });

    // Assert: desktop settings must be preserved in persistence
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem('timelog_persistence_plugin_settings') || '{}');
      expect(saved.theme).toBe('light');
      expect(saved.autoStart).toBe(true);
      expect(saved.minimizeToTray).toBe(true);
      expect(saved.alwaysOnTopSmall).toBe(true);
      expect(saved.alwaysOnTopMain).toBe(true);
    });
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
});

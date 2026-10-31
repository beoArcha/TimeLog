import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  PlatformCapabilitiesContext,
  usePlatformCapabilities,
  PlatformCapabilities,
} from '@common/contexts/PlatformCapabilitiesContext';

describe('PlatformCapabilitiesContext', () => {
  it('should return safe unprivileged defaults when rendered outside of a provider', () => {
    // Arrange & Act
    const { result } = renderHook(() => usePlatformCapabilities());

    // Assert
    expect(result.current.supportsTray).toBe(false);
    expect(result.current.supportsAlwaysOnTop).toBe(false);
    expect(result.current.supportsAutoStart).toBe(false);
    expect(result.current.hasNativeDaemon).toBe(false);
    expect(result.current.canUseCli).toBe(false);
    expect(result.current.storageEngineName).toBe('localStorage');
    expect(result.current.isPwaInstallable).toBe(false);
    expect(result.current.canInspectDatabase).toBe(false);
    expect(result.current.dragRegionProps).toEqual({});
    expect(result.current.supportedLayouts).toEqual(['compact', 'medium', 'full']);
    expect(result.current.defaultLayout).toBe('full');
  });

  it('should provide desktop tauri capabilities when wrapped in a desktop provider', () => {
    // Arrange
    const desktopCapabilities: PlatformCapabilities = {
      dragRegionProps: { 'data-tauri-drag-region': true },
      canInspectDatabase: true,
      supportedLayouts: ['compact', 'medium', 'full'],
      defaultLayout: 'full',
      supportsTray: true,
      supportsAlwaysOnTop: true,
      supportsAutoStart: true,
      isPwaInstallable: false,
      hasNativeDaemon: true,
      canUseCli: true,
      storageEngineName: 'sqlite',
    };

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(PlatformCapabilitiesContext.Provider, { value: desktopCapabilities }, children);

    // Act
    const { result } = renderHook(() => usePlatformCapabilities(), { wrapper });

    // Assert
    expect(result.current.supportsTray).toBe(true);
    expect(result.current.supportsAlwaysOnTop).toBe(true);
    expect(result.current.supportsAutoStart).toBe(true);
    expect(result.current.hasNativeDaemon).toBe(true);
    expect(result.current.canUseCli).toBe(true);
    expect(result.current.storageEngineName).toBe('sqlite');
    expect(result.current.isPwaInstallable).toBe(false);
    expect(result.current.canInspectDatabase).toBe(true);
    expect(result.current.dragRegionProps).toEqual({ 'data-tauri-drag-region': true });
  });

  it('should provide browser pwa capabilities when wrapped in a browser provider', () => {
    // Arrange
    const browserCapabilities: PlatformCapabilities = {
      dragRegionProps: {},
      canInspectDatabase: false,
      supportedLayouts: ['medium', 'full'],
      defaultLayout: 'full',
      supportsTray: false,
      supportsAlwaysOnTop: false,
      supportsAutoStart: false,
      isPwaInstallable: true,
      hasNativeDaemon: false,
      canUseCli: false,
      storageEngineName: 'localStorage',
    };

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(PlatformCapabilitiesContext.Provider, { value: browserCapabilities }, children);

    // Act
    const { result } = renderHook(() => usePlatformCapabilities(), { wrapper });

    // Assert
    expect(result.current.supportsTray).toBe(false);
    expect(result.current.supportsAlwaysOnTop).toBe(false);
    expect(result.current.supportsAutoStart).toBe(false);
    expect(result.current.hasNativeDaemon).toBe(false);
    expect(result.current.canUseCli).toBe(false);
    expect(result.current.storageEngineName).toBe('localStorage');
    expect(result.current.isPwaInstallable).toBe(true);
    expect(result.current.canInspectDatabase).toBe(false);
    expect(result.current.supportedLayouts).toEqual(['medium', 'full']);
  });

  it('should enable cli capability when browser runtime has debug flag enabled', () => {
    // Arrange
    const browserDebugCapabilities: PlatformCapabilities = {
      dragRegionProps: {},
      canInspectDatabase: false,
      supportedLayouts: ['medium', 'full'],
      defaultLayout: 'full',
      supportsTray: false,
      supportsAlwaysOnTop: false,
      supportsAutoStart: false,
      isPwaInstallable: true,
      hasNativeDaemon: false,
      canUseCli: true,
      storageEngineName: 'localStorage',
    };

    const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
      React.createElement(PlatformCapabilitiesContext.Provider, { value: browserDebugCapabilities }, children);

    // Act
    const { result } = renderHook(() => usePlatformCapabilities(), { wrapper });

    // Assert
    expect(result.current.canUseCli).toBe(true);
    expect(result.current.storageEngineName).toBe('localStorage');
    expect(result.current.hasNativeDaemon).toBe(false);
  });
});

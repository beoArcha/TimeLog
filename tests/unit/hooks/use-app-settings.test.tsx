import React from 'react';
import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useAppSettings } from '@common/hooks/useAppSettings';
import { PlatformCapabilitiesContext, PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { setupLocalStorageMock, setupMatchMediaMock } from '@tests/shared/test-helpers';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { Settings as AppSettings } from '@bindings/Settings';

describe('useAppSettings', () => {
  beforeEach(() => {
    setupLocalStorageMock();
    setupMatchMediaMock(false);
    PersistenceRouter.resetForTesting();
  });

  afterEach(() => {
    cleanup();
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

  it('should not save settings to persistence while a re-read triggered by capability changes is in progress', async () => {
    // Arrange
    const initialCapabilities: PlatformCapabilities = {
      dragRegionProps: {},
      canInspectDatabase: false,
      supportedLayouts: ['compact', 'medium', 'full'],
      defaultLayout: 'compact',
      supportsTray: true,
      supportsAlwaysOnTop: true,
      supportsAutoStart: true,
      isPwaInstallable: false,
    };

    localStorage.setItem(
      'timelog_persistence_plugin_settings',
      JSON.stringify({
        theme: 'dark',
        guiVariant: 'compact',
        textAndIconSize: 'medium',
        autoStart: true,
        includePatchesInReports: true,
        activeSinks: ['Csv'],
        alwaysOnTopSmall: true,
        alwaysOnTopMain: true,
        minimizeToTray: true,
      })
    );

    let currentCapabilities = initialCapabilities;
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PlatformCapabilitiesContext.Provider value={currentCapabilities}>
        {children}
      </PlatformCapabilitiesContext.Provider>
    );

    const { result, rerender } = renderHook(() => useAppSettings(), { wrapper });

    await waitFor(() => {
      expect(result.current.theme).toBe('dark');
      expect(result.current.layoutVariant).toBe('compact');
    });

    let resolveDeferredGet!: (val: AppSettings) => void;
    const deferredGetPromise = new Promise<AppSettings>((resolve) => {
      resolveDeferredGet = resolve;
    });

    const getSpy = vi.spyOn(PersistenceRouter.getInstance().settings, 'get').mockReturnValue(deferredGetPromise);
    const saveSpy = vi.spyOn(PersistenceRouter.getInstance().settings, 'save');

    const updatedCapabilities: PlatformCapabilities = {
      ...initialCapabilities,
      supportedLayouts: ['medium', 'full'],
      defaultLayout: 'medium',
    };

    // Act
    currentCapabilities = updatedCapabilities;
    rerender();

    await new Promise((r) => setTimeout(r, 30));

    // Assert
    expect(saveSpy).not.toHaveBeenCalled();

    resolveDeferredGet({
      theme: 'light',
      guiVariant: 'medium',
      textAndIconSize: 'small',
      autoStart: false,
      includePatchesInReports: false,
      activeSinks: ['Csv'],
      alwaysOnTopSmall: false,
      alwaysOnTopMain: false,
      minimizeToTray: false,
    });

    await waitFor(() => {
      expect(result.current.theme).toBe('light');
      expect(result.current.layoutVariant).toBe('medium');
      expect(result.current.textAndIconSize).toBe('small');
    });

    getSpy.mockRestore();
    saveSpy.mockRestore();
  });

  describe('timezone setting validation, persistence, and legacy migration', () => {
    it('should initialize with default System timezone when no settings exist', async () => {
      // Act
      const { result } = renderHook(() => useAppSettings());

      // Assert
      await waitFor(() => {
        expect(result.current.timezone).toBe('System');
      });
      expect(result.current.resolvedTimezone).toBeDefined();
    });

    it('should update timezone state when valid timezone is provided to setTimezone', async () => {
      // Arrange
      const { result } = renderHook(() => useAppSettings());
      await waitFor(() => {
        expect(result.current.timezone).toBe('System');
      });

      // Act
      act(() => {
        result.current.setTimezone('Europe/Warsaw');
      });

      // Assert
      expect(result.current.timezone).toBe('Europe/Warsaw');
      expect(result.current.resolvedTimezone).toBe('Europe/Warsaw');
    });

    it('should reject invalid timezone values in setTimezone and preserve current state', async () => {
      // Arrange
      const { result } = renderHook(() => useAppSettings());
      await waitFor(() => {
        expect(result.current.timezone).toBe('System');
      });

      act(() => {
        result.current.setTimezone('Europe/Paris');
      });
      expect(result.current.timezone).toBe('Europe/Paris');

      // Act - attempt invalid timezone
      act(() => {
        result.current.setTimezone('Invalid/Non_Existent_Timezone');
      });

      // Assert: should retain Europe/Paris
      expect(result.current.timezone).toBe('Europe/Paris');

      // Act - attempt random garbage
      act(() => {
        result.current.setTimezone('!@#$%^');
      });
      expect(result.current.timezone).toBe('Europe/Paris');
    });

    it('should load valid timezone from unified persistence', async () => {
      // Arrange
      localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify({
        theme: 'light',
        guiVariant: 'full',
        textAndIconSize: 'medium',
        autoStart: false,
        includePatchesInReports: true,
        activeSinks: ['Csv'],
        timezone: 'America/Chicago',
      }));

      // Act
      const { result } = renderHook(() => useAppSettings());

      // Assert
      await waitFor(() => {
        expect(result.current.timezone).toBe('America/Chicago');
      });
    });

    it('should fallback to System when persisted timezone is invalid', async () => {
      // Arrange
      localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify({
        theme: 'light',
        guiVariant: 'full',
        textAndIconSize: 'medium',
        autoStart: false,
        includePatchesInReports: true,
        activeSinks: ['Csv'],
        timezone: 'Corrupted/Invalid_Zone_123',
      }));

      // Act
      const { result } = renderHook(() => useAppSettings());

      // Assert
      await waitFor(() => {
        expect(result.current.timezone).toBe('System');
      });
    });

    // 1. Prawidłowa wartość z zunifikowanego persistence ma pierwszeństwo
    it('should prioritize valid timezone from unified persistence over legacy value (Rule 1)', async () => {
      // Arrange
      localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify({
        theme: 'light',
        guiVariant: 'full',
        textAndIconSize: 'medium',
        autoStart: false,
        includePatchesInReports: true,
        activeSinks: ['Csv'],
        timezone: 'America/New_York',
      }));
      localStorage.setItem('oxytime_timezone', 'Europe/Warsaw');

      // Act
      const { result } = renderHook(() => useAppSettings());

      // Assert: Persisted value America/New_York takes precedence over legacy Europe/Warsaw
      await waitFor(() => {
        expect(result.current.timezone).toBe('America/New_York');
      });
      // Legacy key is cleaned up after confirmed save
      await waitFor(() => {
        expect(localStorage.getItem('oxytime_timezone')).toBeNull();
      });
    });

    // 2. Stara wartość może uzupełnić brakującą wartość w zunifikowanym persistence
    it('should populate missing timezone in unified persistence with valid legacy value (Rule 2)', async () => {
      // Arrange - no timezone in unified settings
      localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify({
        theme: 'light',
        guiVariant: 'full',
        textAndIconSize: 'medium',
        autoStart: false,
        includePatchesInReports: true,
        activeSinks: ['Csv'],
      }));
      localStorage.setItem('oxytime_timezone', 'Europe/Berlin');

      // Act
      const { result } = renderHook(() => useAppSettings());

      // Assert: Legacy Europe/Berlin populates the missing timezone
      await waitFor(() => {
        expect(result.current.timezone).toBe('Europe/Berlin');
      });
      // Unified settings must be saved with migrated timezone
      await waitFor(() => {
        const unified = JSON.parse(localStorage.getItem('timelog_persistence_plugin_settings') || '{}');
        expect(unified.timezone).toBe('Europe/Berlin');
      });
      // Legacy key is removed only after confirmed save
      expect(localStorage.getItem('oxytime_timezone')).toBeNull();
    });

    // 3. Stara wartość może uzupełnić domyślną wartość 'System'
    it('should replace default System timezone in unified persistence with valid legacy value (Rule 3)', async () => {
      // Arrange - timezone is explicitly 'System'
      localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify({
        theme: 'light',
        guiVariant: 'full',
        textAndIconSize: 'medium',
        autoStart: false,
        includePatchesInReports: true,
        activeSinks: ['Csv'],
        timezone: 'System',
      }));
      localStorage.setItem('oxytime_timezone', 'Europe/London');

      // Act
      const { result } = renderHook(() => useAppSettings());

      // Assert: Legacy Europe/London replaces default 'System'
      await waitFor(() => {
        expect(result.current.timezone).toBe('Europe/London');
      });
      // Unified settings must be saved
      await waitFor(() => {
        const unified = JSON.parse(localStorage.getItem('timelog_persistence_plugin_settings') || '{}');
        expect(unified.timezone).toBe('Europe/London');
      });
      expect(localStorage.getItem('oxytime_timezone')).toBeNull();
    });

    // 4. Nieprawidłowa wartość nie może nadpisać prawidłowej
    it('should not allow invalid legacy timezone to overwrite valid persisted timezone or migrate (Rule 4)', async () => {
      // Arrange
      localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify({
        theme: 'light',
        guiVariant: 'full',
        textAndIconSize: 'medium',
        autoStart: false,
        includePatchesInReports: true,
        activeSinks: ['Csv'],
        timezone: 'America/Chicago',
      }));
      localStorage.setItem('oxytime_timezone', 'Invalid_Corrupted_Zone');

      // Act
      const { result } = renderHook(() => useAppSettings());

      // Assert: Invalid legacy value cannot overwrite America/Chicago
      await waitFor(() => {
        expect(result.current.timezone).toBe('America/Chicago');
      });
      // Invalid legacy key is cleaned up after confirmed save
      await waitFor(() => {
        expect(localStorage.getItem('oxytime_timezone')).toBeNull();
      });
    });

    // 5. Brak starego klucza nie wymaga migracji
    it('should not trigger migration when legacy timezone key does not exist (Rule 5)', async () => {
      // Arrange
      const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem');
      removeItemSpy.mockClear();

      // Act
      const { result } = renderHook(() => useAppSettings());

      // Assert
      await waitFor(() => {
        expect(result.current.timezone).toBe('System');
      });
      expect(removeItemSpy).not.toHaveBeenCalledWith('oxytime_timezone');
      removeItemSpy.mockRestore();
    });

    // 6. Jeżeli zapis się nie powiedzie: zachowaj stary klucz, zachowaj możliwość ponowienia migracji, zgłoś błąd przez ErrorHandler
    it('should preserve legacy key and allow retry reporting error when persistence save fails (Safe Migration)', async () => {
      // Arrange
      localStorage.setItem('oxytime_timezone', 'Europe/Paris');
      const saveError = new Error('Database disk full');
      const saveSpy = vi.spyOn(PersistenceRouter.getInstance().settings, 'save').mockRejectedValue(saveError);
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      // Act
      renderHook(() => useAppSettings());

      // Assert: ErrorHandler receives save error
      await waitFor(() => {
        expect(errorHandlerSpy).toHaveBeenCalledWith(saveError);
      });
      // Old key MUST NOT be removed from localStorage if persistence save failed
      expect(localStorage.getItem('oxytime_timezone')).toBe('Europe/Paris');

      saveSpy.mockRestore();
      errorHandlerSpy.mockRestore();
    });

    // 7. Błędy odczytu lub usunięcia klucza są zgłaszane przez ErrorHandler zamiast połykane po cichu
    it('should report errors via ErrorHandler when reading or removing legacy key throws (No empty catch)', async () => {
      // Arrange: mock localStorage.getItem throwing a SecurityError
      const accessError = new Error('LocalStorage security restriction');
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
        if (key === 'oxytime_timezone') {
          throw accessError;
        }
        return null;
      });
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      // Act
      const { result } = renderHook(() => useAppSettings());

      // Assert: ErrorHandler must have caught and logged the security exception
      await waitFor(() => {
        expect(errorHandlerSpy).toHaveBeenCalledWith(accessError);
      });
      expect(result.current.timezone).toBe('System');

      getItemSpy.mockRestore();
      errorHandlerSpy.mockRestore();
    });
  });
});

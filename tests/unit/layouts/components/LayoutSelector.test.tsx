import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { LayoutSelector } from '@layouts/components/header-parts/LayoutSelector';
import { PlatformCapabilitiesContext, PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { SettingsContext, SettingsState } from '@common/hooks/SettingsContext';
import { WindowShellContext, WindowShellState } from '@common/contexts/WindowShellContext';
import { LocaleContext } from '@common/hooks/LocaleProvider';
import type { LayoutVariant } from '@bindings/LayoutVariant';

describe('LayoutSelector', () => {
  afterEach(() => {
    cleanup();
  });

  const baseCapabilities: PlatformCapabilities = {
    dragRegionProps: {},
    canInspectDatabase: false,
    supportedLayouts: ['compact', 'medium', 'full'],
    defaultLayout: 'full',
    supportsTray: true,
    supportsAlwaysOnTop: true,
    supportsAutoStart: true,
    isPwaInstallable: false,
  };

  const renderSelector = (
    capabilitiesPatch: Partial<PlatformCapabilities> = {},
    settingsPatch: Partial<SettingsState> = {},
    shellPatch: Partial<WindowShellState> = {}
  ) => {
    const setLayoutVariant = vi.fn();
    const showToast = vi.fn();

    const capabilitiesValue: PlatformCapabilities = {
      ...baseCapabilities,
      ...capabilitiesPatch,
    };

    const settingsValue = {
      layoutVariant: 'full' as const,
      setLayoutVariant,
      ...settingsPatch,
    } as unknown as SettingsState;

    const shellValue = {
      showToast,
      ...shellPatch,
    } as unknown as WindowShellState;

    const localeValue = {
      locale: 'en' as const,
      setLocale: vi.fn(),
      customTranslations: {},
      setCustomTranslations: vi.fn(),
    };

    const renderResult = render(
      <PlatformCapabilitiesContext.Provider value={capabilitiesValue}>
        <LocaleContext.Provider value={localeValue}>
          <SettingsContext.Provider value={settingsValue}>
            <WindowShellContext.Provider value={shellValue}>
              <LayoutSelector />
            </WindowShellContext.Provider>
          </SettingsContext.Provider>
        </LocaleContext.Provider>
      </PlatformCapabilitiesContext.Provider>
    );

    return {
      renderResult,
      setLayoutVariant,
      showToast,
    };
  };

  it('should render compact, medium, and full options when supportedLayouts contains all 3', () => {
    // Arrange
    const supportedLayouts: LayoutVariant[] = ['compact', 'medium', 'full'];

    // Act
    renderSelector({ supportedLayouts });

    // Assert
    expect(screen.getByTestId('layout-variant-compact')).not.toBeNull();
    expect(screen.getByTestId('layout-variant-medium')).not.toBeNull();
    expect(screen.getByTestId('layout-variant-full')).not.toBeNull();
  });

  it('should render only medium and full options when supportedLayouts contains medium and full', () => {
    // Arrange
    const supportedLayouts: LayoutVariant[] = ['medium', 'full'];

    // Act
    renderSelector({ supportedLayouts });

    // Assert
    expect(screen.queryByTestId('layout-variant-compact')).toBeNull();
    expect(screen.getByTestId('layout-variant-medium')).not.toBeNull();
    expect(screen.getByTestId('layout-variant-full')).not.toBeNull();
  });

  it('should call setLayoutVariant when clicking an available option', () => {
    // Arrange
    const { setLayoutVariant } = renderSelector({
      supportedLayouts: ['medium', 'full'],
    });

    // Act
    fireEvent.click(screen.getByTestId('layout-variant-medium'));

    // Assert
    expect(setLayoutVariant).toHaveBeenCalledWith('medium');
  });
});

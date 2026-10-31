// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import AppFooter from '@layouts/components/AppFooter';
import { PlatformCapabilitiesContext, PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

describe('Unit Tests: AppFooter', () => {
  const onNavigateToSettingsMock = vi.fn();
  const setShowCreditsModalMock = vi.fn();

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const renderFooterWithCapabilities = (
    locale: 'en' | 'pl',
    capabilities: Partial<PlatformCapabilities> = {}
  ) => {
    const fullCapabilities: PlatformCapabilities = {
      dragRegionProps: {},
      canInspectDatabase: false,
      supportedLayouts: ['compact', 'medium', 'full'],
      defaultLayout: 'full',
      supportsTray: false,
      supportsAlwaysOnTop: false,
      supportsAutoStart: false,
      isPwaInstallable: false,
      ...capabilities,
    };

    return render(
      <PlatformCapabilitiesContext.Provider value={fullCapabilities}>
        <AppFooter
          locale={locale}
          onNavigateToSettings={onNavigateToSettingsMock}
          setShowCreditsModal={setShowCreditsModalMock}
        />
      </PlatformCapabilitiesContext.Provider>
    );
  };

  it('renders SQLite environment label when storageEngineName is sqlite', () => {
    renderFooterWithCapabilities('en', { storageEngineName: 'sqlite' });
    expect(screen.getByText('Environment — SQLite Engine')).not.toBeNull();
  });

  it('renders LocalStorage environment label when storageEngineName is localStorage', () => {
    renderFooterWithCapabilities('en', { storageEngineName: 'localStorage' });
    expect(screen.getByText('Environment — LocalStorage Engine')).not.toBeNull();
  });

  it('renders localized environment labels in Polish', () => {
    const { unmount } = renderFooterWithCapabilities('pl', { storageEngineName: 'sqlite' });
    expect(screen.getByText('Środowisko — Silnik SQLite')).not.toBeNull();
    unmount();

    renderFooterWithCapabilities('pl', { storageEngineName: 'localStorage' });
    expect(screen.getByText('Środowisko — Silnik LocalStorage')).not.toBeNull();
  });

  it('renders safe settings navigation button without direct reset trigger in English', () => {
    render(
      <AppFooter
        locale="en"
        onNavigateToSettings={onNavigateToSettingsMock}
        setShowCreditsModal={setShowCreditsModalMock}
      />
    );

    const safeNavBtn = screen.getByRole('button', { name: /Database Management/i });
    expect(safeNavBtn).not.toBeNull();

    fireEvent.click(safeNavBtn);
    expect(onNavigateToSettingsMock).toHaveBeenCalledTimes(1);
  });

  it('renders localized safe navigation button in Polish', () => {
    render(
      <AppFooter
        locale="pl"
        onNavigateToSettings={onNavigateToSettingsMock}
        setShowCreditsModal={setShowCreditsModalMock}
      />
    );

    const safeNavBtn = screen.getByRole('button', { name: /Zarządzaj bazą w Ustawieniach/i });
    expect(safeNavBtn).not.toBeNull();

    fireEvent.click(safeNavBtn);
    expect(onNavigateToSettingsMock).toHaveBeenCalledTimes(1);
  });
});

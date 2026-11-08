// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import TabBar from '@layouts/components/TabBar';
import { AppTabId } from '@common/types/navigation';
import { PlatformCapabilitiesContext, PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

describe('Unit Tests: TabBar', () => {
  afterEach(() => {
    cleanup();
  });

  const renderTabBar = (capabilities: Partial<PlatformCapabilities> = {}, activeTab: AppTabId = 'tasks') => {
    const setActiveLargeTab = vi.fn();
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

    const renderResult = render(
      <PlatformCapabilitiesContext.Provider value={fullCapabilities}>
        <TabBar
          locale="en"
          activeLargeTab={activeTab}
          setActiveLargeTab={setActiveLargeTab}
        />
      </PlatformCapabilitiesContext.Provider>
    );

    return { ...renderResult, setActiveLargeTab };
  };

  it('should omit the db tab when canInspectDatabase is false', () => {
    renderTabBar({ canInspectDatabase: false, canUseCli: true });

    expect(screen.queryByTestId('tab-db')).toBeNull();
    expect(screen.getByTestId('tab-tasks')).not.toBeNull();
    expect(screen.getByTestId('tab-cli')).not.toBeNull();
  });

  it('should include the db tab when canInspectDatabase is true', () => {
    renderTabBar({ canInspectDatabase: true, canUseCli: true });

    expect(screen.getByTestId('tab-db')).not.toBeNull();
    expect(screen.getByTestId('tab-tasks')).not.toBeNull();
  });

  it('should omit the cli tab when canUseCli is false', () => {
    renderTabBar({ canUseCli: false, canInspectDatabase: true });

    expect(screen.queryByTestId('tab-cli')).toBeNull();
    expect(screen.getByTestId('tab-tasks')).not.toBeNull();
    expect(screen.getByTestId('tab-db')).not.toBeNull();
  });

  it('should include the cli tab when canUseCli is true', () => {
    renderTabBar({ canUseCli: true, canInspectDatabase: false });

    expect(screen.getByTestId('tab-cli')).not.toBeNull();
    expect(screen.getByTestId('tab-tasks')).not.toBeNull();
    expect(screen.queryByTestId('tab-db')).toBeNull();
  });

  it('should trigger setActiveLargeTab when a tab is clicked', () => {
    const { setActiveLargeTab } = renderTabBar({ canUseCli: true });

    fireEvent.click(screen.getByTestId('tab-reports'));
    expect(setActiveLargeTab).toHaveBeenCalledWith('reports');
  });

  it('should use CSS scale tokens and align tabs to start', () => {
    renderTabBar({ canUseCli: true });

    const tabsList = screen.getByRole('tablist');
    expect(tabsList.className).toContain('justify-start');
    expect(tabsList.className).toContain('gap-section');

    const tasksTab = screen.getByTestId('tab-tasks');
    expect(tasksTab.className).toContain('text-[length:var(--text-main)]');
    expect(tasksTab.className).toContain('padding-section');
    expect(tasksTab.className).toContain('rounded-section');
    expect(tasksTab.className).not.toContain('text-xs');
    expect(tasksTab.className).not.toContain('px-4');

    const label = tasksTab.querySelector('span');
    expect(label).not.toBeNull();
    expect(label?.getAttribute('class')).toContain('text-main');
    expect(label?.getAttribute('class')).not.toContain('text-xs');

    const icon = tasksTab.querySelector('svg');
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute('class')).toContain('icon-medium');
    expect(icon?.getAttribute('class')).not.toContain('w-4');
    expect(icon?.getAttribute('class')).not.toContain('h-4');
  });
});

// @vitest-environment jsdom
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WindowedLayoutContainer,
  WINDOWED_CONTENT_WIDTH,
  WINDOWED_HORIZONTAL_PADDING,
} from '@layouts/components/WindowedLayoutContainer';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import type { GuiState } from '@layouts/hooks/useGuiLogic';
import type { LayoutVariant } from '@bindings/LayoutVariant';

vi.mock('@layouts/builders/MediumLayoutBuilder', () => ({
  default: () => <div data-testid="mock-medium-builder">Medium Builder</div>,
}));

vi.mock('@layouts/components/FullTabSwitchView', () => ({
  FullTabSwitchView: () => <div data-testid="mock-full-builder">Full Builder</div>,
}));

vi.mock('@layouts/components/DaemonStatusBar', () => ({
  default: () => <div data-testid="mock-daemon-status-bar">Daemon Status Bar</div>,
}));

describe('Unit Tests: WindowedLayoutContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const createMockGuiState = (): GuiState =>
    ({
      theme: 'dark',
      locale: 'en',
      projects: [],
      selectedProjectId: null,
      setSelectedProjectId: vi.fn(),
      tasks: [],
      logs: [],
      nowIso: '2026-01-01T12:00:00Z',
      onAddProject: vi.fn(),
      customTranslations: {},
    } as unknown as GuiState);

  const renderContainer = (
    layoutVariant: LayoutVariant = 'full',
    mediumDockPosition: 'left' | 'right' = 'right'
  ) => {
    const setActiveLargeTab = vi.fn();
    const setShowCreditsModal = vi.fn();
    const sharedProps = {
      isCompactExpanded: false,
      setIsCompactExpanded: vi.fn(),
      showToast: vi.fn(),
      handleMinimizeToTray: vi.fn(),
      setLayoutVariant: vi.fn(),
      currentProjectId: null,
      lastNonCompactVariant: 'full' as const,
      alwaysOnTopSmall: false,
      setAlwaysOnTopSmall: vi.fn(),
      dockPosition: mediumDockPosition,
      onToggleDock: vi.fn(),
    };

    return render(
      <MockProviders settingsState={{ layoutVariant }}>
        <WindowedLayoutContainer
          layoutVariant={layoutVariant}
          mediumDockPosition={mediumDockPosition}
          activeLargeTab="tasks"
          setActiveLargeTab={setActiveLargeTab}
          locale="en"
          setShowCreditsModal={setShowCreditsModal}
          guiState={createMockGuiState()}
          sharedProps={sharedProps}
        />
      </MockProviders>
    );
  };

  it('exports standard tokens for windowed layout width and horizontal padding', () => {
    expect(WINDOWED_CONTENT_WIDTH).toBe('w-full max-w-7xl 2xl:max-w-[1600px] mx-auto');
    expect(WINDOWED_HORIZONTAL_PADDING).toBe('px-4 sm:px-6 lg:px-8');
  });

  it('applies WINDOWED_CONTENT_WIDTH to outer window frame in full layout mode', () => {
    const { container } = renderContainer('full');

    const frame = container.querySelector('.shadow-3xl');
    expect(frame).not.toBeNull();
    expect(frame?.className).toContain('w-full');
    expect(frame?.className).toContain('max-w-7xl');
    expect(frame?.className).toContain('2xl:max-w-[1600px]');
    expect(frame?.className).toContain('mx-auto');
  });

  it('configures Area main with consistent padding without duplicate mx-auto in full mode', () => {
    renderContainer('full');

    const mainArea = screen.getByRole('main');
    expect(mainArea).not.toBeNull();
    expect(mainArea.className).toContain('w-full');
    expect(mainArea.className).toContain('px-4');
    expect(mainArea.className).toContain('sm:px-6');
    expect(mainArea.className).toContain('lg:px-8');
    expect(mainArea.className).toContain('py-5');
    expect(mainArea.className).toContain('gap-5');
    // Ensure no redundant mx-auto or max-w-7xl duplicate limits
    expect(mainArea.className).not.toContain('mx-auto');
    expect(mainArea.className).not.toContain('max-w-7xl');
  });

  it('renders TabBar and FullTabSwitchView in full layout mode', () => {
    renderContainer('full');

    expect(screen.getByRole('tablist')).not.toBeNull();
    expect(screen.getByTestId('mock-full-builder')).not.toBeNull();
    expect(screen.queryByTestId('mock-medium-builder')).toBeNull();
  });

  it('applies medium dock classes and hides TabBar in medium layout mode with left dock', () => {
    const { container } = renderContainer('medium', 'left');

    const frame = container.querySelector('.shadow-3xl');
    expect(frame).not.toBeNull();
    expect(frame?.className).toContain('lg:max-w-[500px]');
    expect(frame?.className).toContain('lg:ml-4');
    expect(frame?.className).toContain('lg:mr-auto');
    expect(frame?.className).not.toContain('max-w-7xl');

    expect(screen.queryByRole('tablist')).toBeNull();
    expect(screen.getByTestId('mock-medium-builder')).not.toBeNull();
  });

  it('applies medium dock classes with right dock in medium layout mode', () => {
    const { container } = renderContainer('medium', 'right');

    const frame = container.querySelector('.shadow-3xl');
    expect(frame).not.toBeNull();
    expect(frame?.className).toContain('lg:max-w-[500px]');
    expect(frame?.className).toContain('lg:mr-4');
    expect(frame?.className).toContain('lg:ml-auto');
  });

  it('ensures Header, TabBar, Main, and Footer all align with WINDOWED_HORIZONTAL_PADDING in full mode', () => {
    const { container } = renderContainer('full');

    const header = screen.getByTestId('layout-header');
    expect(header.className).toContain('px-4');
    expect(header.className).toContain('sm:px-6');
    expect(header.className).toContain('lg:px-8');

    const tabBarScroll = screen.getByTestId('tab-bar-scroll');
    expect(tabBarScroll).not.toBeNull();
    expect(tabBarScroll.className).toContain('px-4');
    expect(tabBarScroll.className).toContain('sm:px-6');
    expect(tabBarScroll.className).toContain('lg:px-8');

    const mainArea = screen.getByRole('main');
    expect(mainArea.className).toContain('px-4');
    expect(mainArea.className).toContain('sm:px-6');
    expect(mainArea.className).toContain('lg:px-8');

    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer?.className).toContain('px-4');
    expect(footer?.className).toContain('sm:px-6');
    expect(footer?.className).toContain('lg:px-8');
  });

  it('ensures Footer retains px-3 sm:px-6 padding in medium mode', () => {
    const { container } = renderContainer('medium');

    const footer = container.querySelector('footer');
    expect(footer).not.toBeNull();
    expect(footer?.className).toContain('px-3');
    expect(footer?.className).toContain('sm:px-6');
    expect(footer?.className).not.toContain('lg:px-8');
    expect(footer?.className).not.toContain('px-4');
  });
});

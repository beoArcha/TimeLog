// @vitest-environment jsdom
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LayoutManager from '../../../src/layouts/manager/LayoutManager';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '../../shared/test-helpers';

// Mock components to simplify rendering
vi.mock('@components/BackgroundGradients', () => ({
  default: () => <div data-testid="bg-gradients">Gradients</div>
}));
vi.mock('@components/SystemNotification', () => ({
  default: () => <div data-testid="sys-notification">Notification</div>
}));
vi.mock('../../../src/layouts/components/CreditsModal', () => ({
  default: () => <div data-testid="credits-modal">Credits</div>
}));
vi.mock('../../../src/layouts/components/Header', () => ({
  default: () => <header data-testid="layout-header">Header</header>
}));
vi.mock('../../../src/layouts/components/TabBar', () => ({
  default: () => <nav data-testid="layout-tab-bar">TabBar</nav>
}));
vi.mock('../../../src/layouts/components/DaemonStatusBar', () => ({
  default: () => <div data-testid="daemon-status-bar">Status</div>
}));
vi.mock('../../../src/layouts/components/AppFooter', () => ({
  default: () => <footer data-testid="app-footer">Footer</footer>
}));
vi.mock('@components/RestoreButton', () => ({
  default: () => <button data-testid="restore-btn">Restore</button>
}));

// Mock builders
vi.mock('../../../src/layouts/builders/CompactLayoutBuilder', () => ({
  default: () => <div data-testid="compact-layout">Compact Layout</div>
}));
vi.mock('../../../src/layouts/builders/MediumLayoutBuilder', () => ({
  default: () => <div data-testid="medium-layout">Medium Layout</div>
}));
vi.mock('../../../src/layouts/builders/FullLayoutBuilder', () => ({
  default: () => <div data-testid="full-layout">Full Layout</div>
}));

// We intercept AppProviders to inject our mock state provider instead of the real one.
let activeMockState: OxyFlowState;

vi.mock('../../../src/layouts/manager/AppProviders', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <OxyContext.Provider value={activeMockState}>
      {children}
    </OxyContext.Provider>
  )
}));

describe('Unit Tests: LayoutManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('Given compact LayoutVariant, Then it should render CompactLayoutBuilder', () => {
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'compact',
      isGuiClosed: false,
      isMinimized: false
    };

    const { getByTestId, queryByTestId } = render(<LayoutManager />);

    expect(getByTestId('compact-layout')).not.toBeNull();
    expect(queryByTestId('medium-layout')).toBeNull();
    expect(queryByTestId('full-layout')).toBeNull();
  });

  it('Given medium LayoutVariant, Then it should render MediumLayoutBuilder', () => {
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'medium',
      isGuiClosed: false,
      isMinimized: false
    };

    const { getByTestId, queryByTestId } = render(<LayoutManager />);

    expect(getByTestId('medium-layout')).not.toBeNull();
    expect(queryByTestId('compact-layout')).toBeNull();
    expect(queryByTestId('full-layout')).toBeNull();
    expect(getByTestId('layout-header')).not.toBeNull();
    expect(getByTestId('app-footer')).not.toBeNull();
  });

  it('Given full LayoutVariant, Then it should render FullLayoutBuilder under main tab', () => {
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'full',
      activeLargeTab: 'main',
      isGuiClosed: false,
      isMinimized: false
    };

    const { getByTestId, queryByTestId } = render(<LayoutManager />);

    expect(getByTestId('full-layout')).not.toBeNull();
    expect(queryByTestId('compact-layout')).toBeNull();
    expect(queryByTestId('medium-layout')).toBeNull();
    expect(getByTestId('layout-tab-bar')).not.toBeNull();
  });

  it('should render data-runtime, data-layout-variant and data-text-size attributes on root container', () => {
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'medium',
      textAndIconSize: 'large',
      isGuiClosed: false,
      isMinimized: false
    };

    const { container } = render(<LayoutManager runtime="tauri" />);
    const rootContainer = container.querySelector('#app-root-container');
    expect(rootContainer).not.toBeNull();
    expect(rootContainer?.getAttribute('data-runtime')).toBe('tauri');
    expect(rootContainer?.getAttribute('data-layout-variant')).toBe('medium');
    expect(rootContainer?.getAttribute('data-text-size')).toBe('large');
  });
});

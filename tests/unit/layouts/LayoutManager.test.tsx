// @vitest-environment jsdom
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LayoutManager from '@layouts/manager/LayoutManager';
import { OxyContext, OxyFlowState } from '@common/hooks/OxyContext';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

vi.mock('@components/BackgroundGradients', () => ({
  default: () => <div data-testid="bg-gradients">Gradients</div>
}));
vi.mock('@components/SystemNotification', () => ({
  default: () => <div data-testid="sys-notification">Notification</div>
}));
vi.mock('@layouts/components/CreditsModal', () => ({
  default: () => <div data-testid="credits-modal">Credits</div>
}));
vi.mock('@layouts/components/Header', () => ({
  default: () => <header data-testid="layout-header">Header</header>
}));
vi.mock('@layouts/components/TabBar', () => ({
  default: () => <nav data-testid="layout-tab-bar">TabBar</nav>
}));
vi.mock('@layouts/components/DaemonStatusBar', () => ({
  default: () => <div data-testid="daemon-status-bar">Status</div>
}));
vi.mock('@layouts/components/AppFooter', () => ({
  default: () => <footer data-testid="app-footer">Footer</footer>
}));
vi.mock('@components/RestoreButton', () => ({
  default: ({ setIsMinimized }: any) => (
    <button data-testid="restore-btn" onClick={() => setIsMinimized(false)}>Restore</button>
  )
}));
vi.mock('@layouts/components/GuiClosedAlert', () => ({
  default: () => <div data-testid="gui-closed-alert">Gui Closed Alert</div>
}));

vi.mock('@layouts/builders/CompactLayoutBuilder', () => ({
  default: () => <div data-testid="compact-layout">Compact Layout</div>
}));
vi.mock('@layouts/builders/MediumLayoutBuilder', () => ({
  default: () => <div data-testid="medium-layout">Medium Layout</div>
}));
vi.mock('@layouts/builders/FullLayoutBuilder', () => ({
  default: () => <div data-testid="full-layout">Full Layout</div>
}));

vi.mock('@features/cli/CliInterface', () => ({
  default: () => <div data-testid="mock-cli-interface">CliInterface</div>
}));
vi.mock('@features/db-explorer/DbExplorer', () => ({
  default: () => <div data-testid="mock-db-explorer">DbExplorer</div>
}));
vi.mock('@features/settings/ManualTab', () => ({
  default: () => <div data-testid="mock-manual-tab">ManualTab</div>
}));
vi.mock('@features/settings/CreditsTab', () => ({
  default: () => <div data-testid="mock-credits-tab">CreditsTab</div>
}));
vi.mock('@features/settings/SettingsTab', () => ({
  default: () => <div data-testid="mock-settings-tab">SettingsTab</div>
}));
vi.mock('@features/settings/BackupTab', () => ({
  default: () => <div data-testid="mock-backup-tab">BackupTab</div>
}));
vi.mock('@features/tray/TrayWidgetView', () => ({
  default: ({ onRestore, onStopAll }: any) => (
    <div data-testid="tray-widget-view">
      <button data-testid="btn-restore" onClick={onRestore}>Restore</button>
      <button data-testid="btn-stop-all" onClick={onStopAll}>Stop All</button>
    </div>
  )
}));

let activeMockState: OxyFlowState;

vi.mock('@layouts/manager/AppProviders', () => ({
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

  it('Given isGuiClosed is true, Then it should render GuiClosedAlert', () => {
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'medium',
      isGuiClosed: true,
      isMinimized: false
    };

    const { getByTestId, queryByTestId } = render(<LayoutManager />);
    expect(getByTestId('gui-closed-alert')).not.toBeNull();
    expect(queryByTestId('medium-layout')).toBeNull();
  });

  it('Given isMinimized is true, Then it should render TrayWidgetView and RestoreButton', () => {
    const showToastMock = vi.fn();
    const setIsMinimizedMock = vi.fn();
    const handleStopTimerMock = vi.fn();

    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'medium',
      isGuiClosed: false,
      isMinimized: true,
      setIsMinimized: setIsMinimizedMock,
      showToast: showToastMock,
      handleStopTimer: handleStopTimerMock
    };

    const { getByTestId } = render(<LayoutManager />);
    expect(getByTestId('tray-widget-view')).not.toBeNull();
    expect(getByTestId('restore-btn')).not.toBeNull();

    // Trigger restore via tray button
    fireEvent.click(getByTestId('btn-restore'));
    expect(setIsMinimizedMock).toHaveBeenCalledWith(false);
    expect(showToastMock).toHaveBeenCalled();

    // Trigger stop all
    fireEvent.click(getByTestId('btn-stop-all'));
    expect(handleStopTimerMock).toHaveBeenCalled();
  });

  it('Given activeLargeTab is set to different views under full layout, Then it should render correct components', () => {
    const tabs = [
      { tabName: 'cli', testId: 'mock-cli-interface' },
      { tabName: 'db', testId: 'mock-db-explorer' },
      { tabName: 'backup', testId: 'mock-backup-tab' },
      { tabName: 'options', testId: 'mock-settings-tab' },
      { tabName: 'manual', testId: 'mock-manual-tab' },
      { tabName: 'credits', testId: 'mock-credits-tab' }
    ];

    for (const tab of tabs) {
      activeMockState = {
        ...getMockOxyFlowState(),
        layoutVariant: 'full',
        activeLargeTab: tab.tabName as any,
        isGuiClosed: false,
        isMinimized: false
      };

      const { getByTestId, unmount } = render(<LayoutManager />);
      expect(getByTestId(tab.testId)).not.toBeNull();
      unmount();
    }
  });
});

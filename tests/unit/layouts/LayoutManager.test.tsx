// @vitest-environment jsdom
import React from 'react';
import { render, cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LayoutManager from '@layouts/manager/LayoutManager';
import { getMockOxyFlowState, OxyFlowState } from '@tests/shared/test-helpers';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aTimeLog } from '@tests/shared/builders/entity-builders';

// Only mock heavy layout builders and sub-feature modules
vi.mock('@layouts/builders/CompactLayoutBuilder', () => ({
  default: () => <div data-testid="compact-layout">Compact Layout</div>,
}));
vi.mock('@layouts/builders/MediumLayoutBuilder', () => ({
  default: () => <div data-testid="medium-layout">Medium Layout</div>,
}));
vi.mock('@layouts/builders/FullLayoutBuilder', () => ({
  default: () => <div data-testid="full-layout">Full Layout</div>,
}));

vi.mock('@features/cli/CliInterface', () => ({
  default: () => <div data-testid="mock-cli-interface">CliInterface</div>,
}));
vi.mock('@features/db-explorer/DbExplorer', () => ({
  default: () => <div data-testid="mock-db-explorer">DbExplorer</div>,
}));
vi.mock('@features/settings/ManualTab', () => ({
  default: () => <div data-testid="mock-manual-tab">ManualTab</div>,
}));
vi.mock('@features/settings/CreditsTab', () => ({
  default: () => <div data-testid="mock-credits-tab">CreditsTab</div>,
}));
vi.mock('@features/settings/SettingsTab', () => ({
  default: () => <div data-testid="mock-settings-tab">SettingsTab</div>,
}));
vi.mock('@features/settings/BackupTab', () => ({
  default: () => <div data-testid="mock-backup-tab">BackupTab</div>,
}));

let activeMockState: OxyFlowState;

vi.mock('@layouts/manager/AppProviders', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <MockProviders state={activeMockState}>{children}</MockProviders>
  ),
}));

describe('LayoutManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('should render CompactLayoutBuilder when layoutVariant is compact', () => {
    // Arrange
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'compact',
      isGuiClosed: false,
      isMinimized: false,
    };

    // Act
    render(<LayoutManager runtime="browser" />);

    // Assert
    expect(screen.getByTestId('compact-layout')).not.toBeNull();
    expect(screen.queryByTestId('medium-layout')).toBeNull();
    expect(screen.queryByTestId('full-layout')).toBeNull();
  });

  it('should render MediumLayoutBuilder and Header when layoutVariant is medium', () => {
    // Arrange
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'medium',
      isGuiClosed: false,
      isMinimized: false,
    };

    // Act
    render(<LayoutManager runtime="browser" />);

    // Assert
    expect(screen.getByTestId('medium-layout')).not.toBeNull();
    expect(screen.queryByTestId('compact-layout')).toBeNull();
    expect(screen.queryByTestId('full-layout')).toBeNull();
    expect(screen.getByTestId('layout-header')).not.toBeNull();
  });

  it('should render FullLayoutBuilder and TabBar when layoutVariant is full and active tab is main', () => {
    // Arrange
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'full',
      activeLargeTab: 'main',
      isGuiClosed: false,
      isMinimized: false,
    };

    // Act
    render(<LayoutManager runtime="browser" />);

    // Assert
    expect(screen.getByTestId('full-layout')).not.toBeNull();
    expect(screen.queryByTestId('compact-layout')).toBeNull();
    expect(screen.queryByTestId('medium-layout')).toBeNull();
    expect(screen.getByRole('tablist', { name: /tabs/i })).not.toBeNull();
  });

  it('should render data-runtime, data-layout-variant, and data-text-size attributes on root container', () => {
    // Arrange
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'medium',
      textAndIconSize: 'large',
      isGuiClosed: false,
      isMinimized: false,
    };

    // Act
    const { container } = render(<LayoutManager runtime="tauri" />);

    // Assert
    const rootContainer = container.querySelector('#app-root-container');
    expect(rootContainer).not.toBeNull();
    expect(rootContainer?.getAttribute('data-runtime')).toBe('tauri');
    expect(rootContainer?.getAttribute('data-layout-variant')).toBe('medium');
    expect(rootContainer?.getAttribute('data-text-size')).toBe('large');
  });

  it('should render real GuiClosedAlert and call setIsGuiClosed when restart button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    const setIsGuiClosedMock = vi.fn();
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'medium',
      isGuiClosed: true,
      setIsGuiClosed: setIsGuiClosedMock,
      isMinimized: false,
    };

    // Act
    render(<LayoutManager runtime="browser" />);

    // Assert Alert is visible
    expect(screen.queryByTestId('medium-layout')).toBeNull();
    const restartBtn = screen.getByRole('button');
    expect(restartBtn).not.toBeNull();

    // Act: click restart
    await user.click(restartBtn);

    // Assert
    expect(setIsGuiClosedMock).toHaveBeenCalledWith(false);
  });

  it('should render real TrayWidgetView when isMinimized is true and handle restore and stop all actions', async () => {
    // Arrange
    const user = userEvent.setup();
    const showToastMock = vi.fn();
    const setIsMinimizedMock = vi.fn();
    const handleStopTimerMock = vi.fn();
    const runningLog = aTimeLog({ id: 'log_active', endTime: null });

    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'medium',
      isGuiClosed: false,
      isMinimized: true,
      logs: [runningLog],
      setIsMinimized: setIsMinimizedMock,
      showToast: showToastMock,
      handleStopTimer: handleStopTimerMock,
    };

    // Act
    const { container } = render(<LayoutManager runtime="browser" />);

    // Assert Tray Widget is displayed
    expect(container.querySelector('#simulated-tray-widget')).not.toBeNull();

    // Trigger restore via tray restore button
    const restoreBtn = container.querySelector('#tray-restore-btn') as HTMLElement;
    expect(restoreBtn).not.toBeNull();
    await user.click(restoreBtn);
    expect(setIsMinimizedMock).toHaveBeenCalledWith(false);
    expect(showToastMock).toHaveBeenCalled();

    // Trigger pause all via tray pause button
    const killAllBtn = container.querySelector('#tray-kill-all-btn') as HTMLElement;
    expect(killAllBtn).not.toBeNull();
    await user.click(killAllBtn);
    expect(handleStopTimerMock).toHaveBeenCalled();
  });

  it('should render correct feature view under full layout when activeLargeTab is switched', () => {
    // Arrange
    const tabs = [
      { tabName: 'cli', testId: 'mock-cli-interface' },
      { tabName: 'db', testId: 'mock-db-explorer' },
      { tabName: 'backup', testId: 'mock-backup-tab' },
      { tabName: 'options', testId: 'mock-settings-tab' },
      { tabName: 'manual', testId: 'mock-manual-tab' },
      { tabName: 'credits', testId: 'mock-credits-tab' },
    ];

    for (const tab of tabs) {
      activeMockState = {
        ...getMockOxyFlowState(),
        layoutVariant: 'full',
        activeLargeTab: tab.tabName,
        isGuiClosed: false,
        isMinimized: false,
      };

      // Act
      const { unmount } = render(<LayoutManager runtime="browser" />);

      // Assert
      expect(screen.getByTestId(tab.testId)).not.toBeNull();
      unmount();
    }
  });

  it('should render SystemNotification when trayNotification is provided', () => {
    // Arrange
    activeMockState = {
      ...getMockOxyFlowState(),
      layoutVariant: 'medium',
      isGuiClosed: false,
      isMinimized: false,
      trayNotification: 'Synchronized with system tray',
    };

    // Act
    const { container } = render(<LayoutManager runtime="browser" />);

    // Assert
    expect(container.querySelector('#tray-toast-notification')).not.toBeNull();
    expect(screen.getByText('Synchronized with system tray')).not.toBeNull();
  });
});

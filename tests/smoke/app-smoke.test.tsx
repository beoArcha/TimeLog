// @vitest-environment jsdom
import React, { useState } from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TabBar, { LargeTabId } from '@layouts/components/TabBar';
import ActiveTimerBanner from '@layouts/parts/ActiveTimerBanner';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { GuiState } from '@layouts/hooks/useGuiLogic';
import { getMockOxyFlowState } from '@tests/shared/test-helpers';

/**
 * Smoke Harness: Mounts TabBar and ActiveTimerBanner to verify fundamental navigation and timer rendering.
 */
function SmokeHarness({
  initialTab = 'main',
  hasActiveTimer = false,
  onStopSpy = vi.fn(),
}: {
  initialTab?: LargeTabId;
  hasActiveTimer?: boolean;
  onStopSpy?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<LargeTabId>(initialTab);
  const project = aProject({ id: 'p1', name: 'Alpha Project' });
  const task = aTask({ id: 't1', projectId: 'p1', name: 'Alpha Task' });
  const activeLog = hasActiveTimer
    ? aTimeLog({ id: 'l1', projectId: 'p1', taskId: 't1', startTime: '2026-06-15T10:00:00Z', endTime: undefined })
    : null;

  const mockState = {
    ...getMockOxyFlowState(),
    projects: [project],
    tasks: [task],
    activeLog,
    logs: activeLog ? [activeLog] : [],
    nowIso: '2026-06-15T10:05:00Z',
    onStopTimer: onStopSpy,
  } as unknown as GuiState;

  return (
    <MockProviders>
      <div data-testid="smoke-root" className="flex flex-col gap-4">
        <TabBar
          locale="en"
          activeLargeTab={activeTab}
          setActiveLargeTab={setActiveTab}
        />
        <ActiveTimerBanner state={mockState} isCondensed={false} />
        <div data-testid="active-tab-indicator">{activeTab}</div>
      </div>
    </MockProviders>
  );
}

describe('Given Application Smoke Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('When the application harness mounts in idle state', () => {
    it('Then it should render the navigation tabs and idle banner promptly', () => {
      // Given
      const onStop = vi.fn();

      // When
      render(<SmokeHarness initialTab="main" hasActiveTimer={false} onStopSpy={onStop} />);

      // Then
      expect(screen.getByRole('tablist', { name: /navigation tabs/i })).toBeTruthy();
      expect(screen.getByTestId('tab-main').getAttribute('aria-selected')).toBe('true');
      expect(screen.getByTestId('tab-reports').getAttribute('aria-selected')).toBe('false');
      expect(screen.getByTestId('active-tab-indicator').textContent).toBe('main');
    });
  });

  describe('When navigating between tabs in the navigation bar', () => {
    it('Then it should update the active tab selection on user click', () => {
      // Given
      render(<SmokeHarness initialTab="main" hasActiveTimer={false} />);
      const reportsTab = screen.getByTestId('tab-reports');

      // When
      fireEvent.click(reportsTab);

      // Then
      expect(screen.getByTestId('tab-reports').getAttribute('aria-selected')).toBe('true');
      expect(screen.getByTestId('tab-main').getAttribute('aria-selected')).toBe('false');
      expect(screen.getByTestId('active-tab-indicator').textContent).toBe('reports');
    });
  });

  describe('When an active timer is running', () => {
    it('Then it should display the active project and task names and allow stopping', () => {
      // Given
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-06-15T10:05:00Z'));
      const stopSpy = vi.fn();
      render(<SmokeHarness initialTab="main" hasActiveTimer={true} onStopSpy={stopSpy} />);

      // When
      const stopButton = screen.getByRole('button', { name: /stop/i });
      fireEvent.click(stopButton);

      // Then
      expect(screen.getByText('Alpha Project')).toBeTruthy();
      expect(screen.getByText('Alpha Task')).toBeTruthy();
      expect(stopSpy).toHaveBeenCalledTimes(1);
    });
  });
});

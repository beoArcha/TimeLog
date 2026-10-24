// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import TrayWidgetView from '@features/tray/TrayWidgetView';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';
import { getMockOxyFlowState, setupMatchMediaMock } from '@tests/shared/test-helpers';

describe('Given TrayWidgetView in desktop minimized state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When user clicks restore button', () => {
    it('Then it should invoke onRestore callback to expand main window', () => {
      // Given
      const mockState = getMockOxyFlowState();
      const onRestoreSpy = vi.fn();
      const onStopAllSpy = vi.fn();

      render(
        <MockProviders state={mockState}>
          <TrayWidgetView onRestore={onRestoreSpy} onStopAll={onStopAllSpy} showToast={vi.fn()} />
        </MockProviders>
      );

      // When
      const buttons = screen.getAllByRole('button');
      const restoreBtn = buttons.find((btn) => btn.id === 'tray-restore-btn');
      expect(restoreBtn).toBeDefined();
      fireEvent.click(restoreBtn!);

      // Then
      expect(onRestoreSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('When running timer exists and user clicks stop all', () => {
    it('Then it should invoke onStopAll callback to stop background threads', () => {
      // Given
      const mockState = getMockOxyFlowState();
      const project = aProject({ id: 'p1', name: 'Background Project' });
      const task = aTask({ id: 't1', projectId: 'p1', name: 'Background Task' });
      const activeLog = aTimeLog({
        id: 'l1',
        projectId: 'p1',
        taskId: 't1',
        startTime: '2026-06-15T10:00:00Z',
        endTime: null,
      });

      mockState.projects = [project];
      mockState.tasks = [task];
      mockState.logs = [activeLog];

      const onRestoreSpy = vi.fn();
      const onStopAllSpy = vi.fn();

      render(
        <MockProviders state={mockState}>
          <TrayWidgetView onRestore={onRestoreSpy} onStopAll={onStopAllSpy} showToast={vi.fn()} />
        </MockProviders>
      );

      // When
      expect(screen.getByText('Background Task')).toBeDefined();

      const actionButtons = screen.getAllByRole('button');
      const stopAllBtn = actionButtons.find((btn) => btn.id === 'tray-kill-all-btn');
      expect(stopAllBtn).toBeDefined();
      expect(stopAllBtn?.hasAttribute('disabled')).toBe(false);
      fireEvent.click(stopAllBtn!);

      // Then
      expect(onStopAllSpy).toHaveBeenCalledTimes(1);
    });
  });
});

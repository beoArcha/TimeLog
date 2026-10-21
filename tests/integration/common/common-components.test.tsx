import { MockProviders } from '@tests/shared/mocks/MockProviders';
// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import TrayWidgetView from '@features/tray/TrayWidgetView';
import EngineConfig from '@/src/features/settings/components/EngineConfig';
import HolidaysLeavesView from '@features/holidays/HolidaysLeavesView';
import { setupMatchMediaMock, getMockOxyFlowState } from '@tests/shared/test-helpers';
import { aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Given common application components and widgets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
  });

  describe('When TrayWidgetView is rendered and user triggers restore', () => {
    it('Then it should invoke onRestore callback', () => {
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
      const restoreBtn = screen.getByRole('button', { name: /maximize|restore/i });
      fireEvent.click(restoreBtn);

      // Then
      expect(onRestoreSpy).toHaveBeenCalled();
    });
  });

  describe('When TrayWidgetView is rendered with active running logs and user pauses all', () => {
    it('Then it should invoke onStopAll callback', () => {
      // Given
      const mockState = getMockOxyFlowState();
      mockState.logs = [
        aTimeLog({ id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: null })
      ];
      const onRestoreSpy = vi.fn();
      const onStopAllSpy = vi.fn();

      render(
        <MockProviders state={mockState}>
          <TrayWidgetView onRestore={onRestoreSpy} onStopAll={onStopAllSpy} showToast={vi.fn()} />
        </MockProviders>
      );

      // When
      const pauseBtn = screen.getByRole('button', { name: /pause|suspend/i });
      fireEvent.click(pauseBtn);

      // Then
      expect(onStopAllSpy).toHaveBeenCalled();
    });
  });

  describe('When EngineConfig options card is expanded and autoStart is toggled', () => {
    it('Then it should invoke setSysSettings with updated configuration', () => {
      // Given
      const mockState = getMockOxyFlowState();
      render(
        <MockProviders state={mockState}>
          <EngineConfig />
        </MockProviders>
      );

      // When
      const header = screen.getByTestId('collapsible-trigger-engine-settings');
      fireEvent.click(header);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Then
      expect(mockState.setSysSettings).toHaveBeenCalled();
    });
  });

  describe('When HolidaysLeavesView registration form is filled and submitted', () => {
    it('Then it should delegate holiday creation to state coordinator', () => {
      // Given
      const mockState = getMockOxyFlowState();
      const { container } = render(
        <MockProviders state={mockState}>
          <HolidaysLeavesView />
        </MockProviders>
      );

      // When
      const textInputs = screen.getAllByRole('textbox');
      fireEvent.change(textInputs[0], { target: { value: 'My Holiday' } });

      const submitBtn = container.querySelector('button[type="submit"]');
      expect(submitBtn).toBeTruthy();
      fireEvent.click(submitBtn!);

      // Then
      expect(mockState.handleAddHoliday).toHaveBeenCalledWith('2026-06-15', 'leave', 'My Holiday');
    });
  });
});

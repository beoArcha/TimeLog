// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OxyContext } from '@common/hooks/OxyContext';
import TrayWidgetView from '@features/tray/TrayWidgetView';
import EngineConfig from '@components/EngineConfig';
import HolidaysLeavesView from '@features/holidays/HolidaysLeavesView';
import { setupMatchMediaMock, getMockOxyFlowState } from '@tests/shared/test-helpers';

describe('Integration Tests: Common Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
  });

  describe('TrayWidgetView', () => {
    it('Given TrayWidgetView rendered, When restore button clicked, Then it should call onRestore', () => {
      const mockState = getMockOxyFlowState();
      const onRestoreSpy = vi.fn();
      const onStopAllSpy = vi.fn();

      render(
        <OxyContext.Provider value={mockState}>
          <TrayWidgetView onRestore={onRestoreSpy} onStopAll={onStopAllSpy} showToast={vi.fn()} />
        </OxyContext.Provider>
      );

      const restoreBtn = screen.getByText(/Maximize and Restore/i);
      fireEvent.click(restoreBtn);
      expect(onRestoreSpy).toHaveBeenCalled();
    });

    it('Given TrayWidgetView rendered with running logs, When pause all clicked, Then it should call onStopAll', () => {
      const mockState = getMockOxyFlowState();
      mockState.logs = [
        { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: null }
      ];
      const onRestoreSpy = vi.fn();
      const onStopAllSpy = vi.fn();

      render(
        <OxyContext.Provider value={mockState}>
          <TrayWidgetView onRestore={onRestoreSpy} onStopAll={onStopAllSpy} showToast={vi.fn()} />
        </OxyContext.Provider>
      );

      const pauseBtn = screen.getByText(/Suspend all processes/i);
      fireEvent.click(pauseBtn);
      expect(onStopAllSpy).toHaveBeenCalled();
    });
  });

  describe('EngineConfig', () => {
    it('Given EngineConfig rendered, When autoStart checkbox toggled, Then it should call setSysSettings', () => {
      const mockState = getMockOxyFlowState();
      render(
        <OxyContext.Provider value={mockState}>
          <EngineConfig />
        </OxyContext.Provider>
      );

      const header = screen.getByText('Engine Options & Daemons');
      fireEvent.click(header);

      const checkbox = screen.getByLabelText('Start on system boot');
      fireEvent.click(checkbox);
      expect(mockState.setSysSettings).toHaveBeenCalled();
    });
  });

  describe('HolidaysLeavesView', () => {
    it('Given HolidaysLeavesView rendered, When form submitted, Then it should call setHolidays', () => {
      const mockState = getMockOxyFlowState();
      render(
        <OxyContext.Provider value={mockState}>
          <HolidaysLeavesView />
        </OxyContext.Provider>
      );

      const nameInput = screen.getByPlaceholderText(/e.g. Vibe dancing leave.../i);
      fireEvent.change(nameInput, { target: { value: 'My Holiday' } });

      const saveBtn = screen.getByText(/Save/i);
      fireEvent.click(saveBtn);

      expect(mockState.handleAddHoliday).toHaveBeenCalledWith('2026-06-15', 'leave', 'My Holiday');
    });
  });
});

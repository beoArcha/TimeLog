// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OxyContext } from '@common/hooks/OxyContext';
import TrayWidget from '../../../src/components/common/TrayWidget';
import EngineConfig from '../../../src/components/common/EngineConfig';
import HolidaysAndLeaves from '../../../src/components/common/HolidaysAndLeaves';
import { setupMatchMediaMock, getMockOxyFlowState } from '../../shared/test-helpers';

describe('Integration Tests: Common Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
  });

  afterEach(() => {
    cleanup();
  });

  describe('TrayWidget', () => {
    it('Given TrayWidget rendered, When restore button clicked, Then it should call onRestore', () => {
      const mockState = getMockOxyFlowState();
      const onRestoreSpy = vi.fn();
      const onStopAllSpy = vi.fn();

      render(
        <OxyContext.Provider value={mockState}>
          <TrayWidget onRestore={onRestoreSpy} onStopAll={onStopAllSpy} showToast={vi.fn()} />
        </OxyContext.Provider>
      );

      const restoreBtn = screen.getByText(/Maximize and Restore/i);
      fireEvent.click(restoreBtn);
      expect(onRestoreSpy).toHaveBeenCalled();
    });

    it('Given TrayWidget rendered with running logs, When pause all clicked, Then it should call onStopAll', () => {
      const mockState = getMockOxyFlowState();
      mockState.logs = [
        { id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: null }
      ];
      const onRestoreSpy = vi.fn();
      const onStopAllSpy = vi.fn();

      render(
        <OxyContext.Provider value={mockState}>
          <TrayWidget onRestore={onRestoreSpy} onStopAll={onStopAllSpy} showToast={vi.fn()} />
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

  describe('HolidaysAndLeaves', () => {
    it('Given HolidaysAndLeaves rendered, When form submitted, Then it should call setHolidays', () => {
      const mockState = getMockOxyFlowState();
      render(
        <OxyContext.Provider value={mockState}>
          <HolidaysAndLeaves />
        </OxyContext.Provider>
      );

      const nameInput = screen.getByPlaceholderText(/e.g. Vibe dancing leave.../i);
      fireEvent.change(nameInput, { target: { value: 'My Holiday' } });

      const saveBtn = screen.getByText(/Save/i);
      fireEvent.click(saveBtn);

      expect(mockState.setHolidays).toHaveBeenCalled();
    });
  });
});

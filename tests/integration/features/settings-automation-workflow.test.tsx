// @vitest-environment jsdom
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SettingsTab from '@features/settings/SettingsTab';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { getMockOxyFlowState, setupMatchMediaMock } from '@tests/shared/test-helpers';
import { WorkflowRouter } from '@common/workflows/WorkflowRouter';
import { aWorkflowConfig } from '@tests/shared/builders/entity-builders';
import { IWorkflow, WorkflowStatus, WorkflowConfig } from '@common/workflows/IWorkflow';

describe('Given SettingsTab and Workflow Automation settings', () => {
  let mockWorkflow: IWorkflow;
  let saveConfigSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setupMatchMediaMock(false);
    WorkflowRouter.resetForTesting();

    saveConfigSpy = vi.fn();
    const mockStatus: WorkflowStatus = {
      isDaemonRunning: false,
      lastCheckIso: '2026-10-22T20:00:00Z',
    };

    mockWorkflow = {
      getConfig: vi.fn().mockResolvedValue(
        aWorkflowConfig({
          autoStopHoursLimitEnabled: true,
          autoStopHoursLimit: 8,
          autoStopDailyBoundaryEnabled: true,
          autoStopDailyBoundaryTime: '23:59',
          autoStopOnTaskComplete: true,
          warningNotificationEnabled: true,
        })
      ),
      saveConfig: saveConfigSpy as (config: WorkflowConfig) => Promise<void>,
      getStatus: vi.fn().mockResolvedValue(mockStatus),
      checkRules: vi.fn().mockResolvedValue({
        stopped: false,
        warning: false,
        stopReason: null,
        warningMessage: null,
        stoppedLogId: null,
      }),
      startDaemon: vi.fn().mockResolvedValue(undefined),
      stopDaemon: vi.fn().mockResolvedValue(undefined),
    };
    WorkflowRouter.getInstance().setImplementationForTesting(mockWorkflow);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('When user toggles auto-start in engine config card', () => {
    it('Then it should persist updated configuration to system settings', async () => {
      // Given
      const mockState = getMockOxyFlowState();

      render(
        <MockProviders state={mockState}>
          <SettingsTab />
        </MockProviders>
      );

      // When
      const engineHeader = screen.getByTestId('collapsible-trigger-engine-settings');
      fireEvent.click(engineHeader);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      // Then
      expect(mockState.setSysSettings).toHaveBeenCalled();
    });
  });

  describe('When user toggles and adjusts daily boundary automation rule', () => {
    it('Then it should update boundary time and persist to WorkflowRouter', async () => {
      // Given
      const mockState = getMockOxyFlowState();

      render(
        <MockProviders state={mockState}>
          <SettingsTab />
        </MockProviders>
      );

      // When: expand automation card
      const automationHeader = screen.getByTestId('collapsible-trigger-automation-settings');
      fireEvent.click(automationHeader);

      const boundaryInput = await screen.findByTestId('workflow-boundary-time-input');
      fireEvent.change(boundaryInput, { target: { value: '22:30' } });

      // Then
      expect(saveConfigSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          autoStopDailyBoundaryTime: '22:30',
        })
      );
    });
  });

  describe('When user adjusts working hours limit and triggers manual check', () => {
    it('Then it should persist updated limit and evaluate rules via WorkflowRouter', async () => {
      // Given
      const mockState = getMockOxyFlowState();

      render(
        <MockProviders state={mockState}>
          <SettingsTab />
        </MockProviders>
      );

      // When
      const automationHeader = screen.getByTestId('collapsible-trigger-automation-settings');
      fireEvent.click(automationHeader);

      const hoursInput = await screen.findByTestId('workflow-hours-input');
      fireEvent.change(hoursInput, { target: { value: '6' } });

      const checkNowBtn = await screen.findByTestId('workflow-check-now-btn');
      fireEvent.click(checkNowBtn);

      // Then
      expect(saveConfigSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          autoStopHoursLimit: 6,
        })
      );
      await waitFor(() => {
        expect(mockWorkflow.checkRules).toHaveBeenCalled();
      });
    });
  });

  describe('When user initiates destructive reset with confirmation keyword', () => {
    it('Then it should clear entity state arrays in DataContext coordinator', async () => {
      // Given
      const mockState = getMockOxyFlowState();

      render(
        <MockProviders state={mockState}>
          <SettingsTab />
        </MockProviders>
      );

      // When
      const destructiveHeader = screen.getByTestId('destructive-zone-card');
      fireEvent.click(destructiveHeader);

      const resetBtn = screen.getByTestId('hard-reset-btn');
      fireEvent.click(resetBtn);

      const promptInput = screen.getByTestId('prompt-dialog-input');
      fireEvent.change(promptInput, { target: { value: 'reset' } });

      const confirmBtn = screen.getByTestId('prompt-dialog-confirm-btn');
      fireEvent.click(confirmBtn);

      // Then
      expect(mockState.setProjects).toHaveBeenCalledWith([]);
      expect(mockState.setTasks).toHaveBeenCalledWith([]);
      expect(mockState.setLogs).toHaveBeenCalledWith([]);
    });
  });
});

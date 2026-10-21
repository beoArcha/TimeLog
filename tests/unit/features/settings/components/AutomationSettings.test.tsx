import { render, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AutomationSettings from '@/src/features/settings/components/AutomationSettings';
import { MockProviders } from '@tests/shared/mocks/MockProviders';
import { WorkflowRouter } from '@common/workflows/WorkflowRouter';
import { IWorkflow, WorkflowCheckResult, WorkflowStatus } from '@common/workflows/IWorkflow';
import { aWorkflowConfig } from '@tests/shared/builders/entity-builders';

describe('AutomationSettings', () => {
  let mockWorkflow: IWorkflow;

  beforeEach(() => {
    WorkflowRouter.resetForTesting();

    mockWorkflow = {
      getConfig: vi.fn().mockResolvedValue(
        aWorkflowConfig({
          autoStopHoursLimitEnabled: false,
          autoStopHoursLimit: 8,
          autoStopDailyBoundaryEnabled: false,
          autoStopDailyBoundaryTime: '19:00',
          autoStopOnTaskComplete: false,
          warningNotificationEnabled: true,
        })
      ),
      saveConfig: vi.fn().mockResolvedValue(undefined),
      getStatus: vi.fn().mockResolvedValue({
        isDaemonRunning: true,
        lastCheckIso: '2026-10-19T09:00:00.000Z',
      } as WorkflowStatus),
      checkRules: vi.fn().mockResolvedValue({
        stopped: false,
        warning: false,
      } as WorkflowCheckResult),
      startDaemon: vi.fn().mockResolvedValue(undefined),
      stopDaemon: vi.fn().mockResolvedValue(undefined),
    };

    WorkflowRouter.getInstance().setImplementationForTesting(mockWorkflow);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <MockProviders>
        <AutomationSettings />
      </MockProviders>
    );

  it('should render collapsible trigger and display automation card header', async () => {
    // Arrange: component mounted inside MockProviders

    // Act
    const { getByTestId } = renderComponent();
    const trigger = getByTestId('collapsible-trigger-automation-settings');

    // Assert
    expect(trigger).toBeDefined();
    await waitFor(() => {
      expect(mockWorkflow.getConfig).toHaveBeenCalledTimes(1);
      expect(mockWorkflow.getStatus).toHaveBeenCalledTimes(1);
    });
  });

  it('should display rules checkboxes when card is expanded', async () => {
    // Arrange
    const { getByTestId } = renderComponent();
    const trigger = getByTestId('collapsible-trigger-automation-settings');

    // Act
    fireEvent.click(trigger);

    // Assert
    await waitFor(() => {
      expect(getByTestId('workflow-hours-limit-checkbox')).toBeDefined();
      expect(getByTestId('workflow-daily-boundary-checkbox')).toBeDefined();
      expect(getByTestId('workflow-task-complete-checkbox')).toBeDefined();
      expect(getByTestId('workflow-warning-checkbox')).toBeDefined();
    });
  });

  it('should trigger saveConfig when hours limit checkbox is toggled', async () => {
    // Arrange
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('collapsible-trigger-automation-settings'));

    // Act
    await waitFor(() => expect(getByTestId('workflow-hours-limit-checkbox')).toBeDefined());
    fireEvent.click(getByTestId('workflow-hours-limit-checkbox'));

    // Assert
    await waitFor(() => {
      expect(mockWorkflow.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ autoStopHoursLimitEnabled: true })
      );
    });
  });

  it('should display hours input when hours limit is enabled and save new hours on change', async () => {
    // Arrange: config starts with hours limit enabled
    mockWorkflow.getConfig = vi.fn().mockResolvedValue(
      aWorkflowConfig({
        autoStopHoursLimitEnabled: true,
        autoStopHoursLimit: 8,
      })
    );

    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('collapsible-trigger-automation-settings'));

    // Act
    await waitFor(() => expect(getByTestId('workflow-hours-input')).toBeDefined());
    const input = getByTestId('workflow-hours-input');
    fireEvent.change(input, { target: { value: '6' } });

    // Assert
    await waitFor(() => {
      expect(mockWorkflow.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ autoStopHoursLimit: 6 })
      );
    });
  });

  it('should trigger saveConfig when daily boundary checkbox is toggled', async () => {
    // Arrange
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('collapsible-trigger-automation-settings'));

    // Act
    await waitFor(() => expect(getByTestId('workflow-daily-boundary-checkbox')).toBeDefined());
    fireEvent.click(getByTestId('workflow-daily-boundary-checkbox'));

    // Assert
    await waitFor(() => {
      expect(mockWorkflow.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ autoStopDailyBoundaryEnabled: true })
      );
    });
  });

  it('should trigger saveConfig when stop on task complete is toggled', async () => {
    // Arrange
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('collapsible-trigger-automation-settings'));

    // Act
    await waitFor(() => expect(getByTestId('workflow-task-complete-checkbox')).toBeDefined());
    fireEvent.click(getByTestId('workflow-task-complete-checkbox'));

    // Assert
    await waitFor(() => {
      expect(mockWorkflow.saveConfig).toHaveBeenCalledWith(
        expect.objectContaining({ autoStopOnTaskComplete: true })
      );
    });
  });

  it('should trigger checkRules and refresh status when manual check button is clicked', async () => {
    // Arrange
    const { getByTestId } = renderComponent();
    fireEvent.click(getByTestId('collapsible-trigger-automation-settings'));

    // Act
    await waitFor(() => expect(getByTestId('workflow-check-now-btn')).toBeDefined());
    fireEvent.click(getByTestId('workflow-check-now-btn'));

    // Assert
    await waitFor(() => {
      expect(mockWorkflow.checkRules).toHaveBeenCalledTimes(1);
      expect(mockWorkflow.getStatus).toHaveBeenCalledTimes(2);
    });
  });
});

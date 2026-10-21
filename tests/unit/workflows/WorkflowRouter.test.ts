import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkflowRouter } from '@common/workflows/WorkflowRouter';
import { IWorkflow, WorkflowCheckResult, WorkflowStatus } from '@common/workflows/IWorkflow';
import { aWorkflowConfig } from '@tests/shared/builders/entity-builders';

describe('WorkflowRouter', () => {
  beforeEach(() => {
    WorkflowRouter.resetForTesting();
    vi.restoreAllMocks();
  });

  it('should return the same singleton instance when called multiple times', () => {
    // Arrange: router instance is not yet requested

    // Act
    const instanceA = WorkflowRouter.getInstance();
    const instanceB = WorkflowRouter.getInstance();

    // Assert
    expect(instanceA).toBe(instanceB);
  });

  it('should create a fresh instance when resetForTesting is invoked', () => {
    // Arrange
    const firstInstance = WorkflowRouter.getInstance();

    // Act
    WorkflowRouter.resetForTesting();
    const secondInstance = WorkflowRouter.getInstance();

    // Assert
    expect(secondInstance).not.toBe(firstInstance);
  });

  it('should delegate getConfig to active implementation when invoked', async () => {
    // Arrange
    const router = WorkflowRouter.getInstance();
    const expectedConfig = aWorkflowConfig({ autoStopHoursLimit: 6 });
    const mockImpl: IWorkflow = {
      getConfig: vi.fn().mockResolvedValue(expectedConfig),
      saveConfig: vi.fn().mockResolvedValue(undefined),
      getStatus: vi.fn(),
      checkRules: vi.fn(),
      startDaemon: vi.fn(),
      stopDaemon: vi.fn(),
    };
    router.setImplementationForTesting(mockImpl);

    // Act
    const result = await router.getConfig();

    // Assert
    expect(mockImpl.getConfig).toHaveBeenCalledTimes(1);
    expect(result).toEqual(expectedConfig);
  });

  it('should delegate saveConfig to active implementation with provided config', async () => {
    // Arrange
    const router = WorkflowRouter.getInstance();
    const configToSave = aWorkflowConfig({ autoStopDailyBoundaryEnabled: true, autoStopDailyBoundaryTime: '18:30' });
    const mockImpl: IWorkflow = {
      getConfig: vi.fn(),
      saveConfig: vi.fn().mockResolvedValue(undefined),
      getStatus: vi.fn(),
      checkRules: vi.fn(),
      startDaemon: vi.fn(),
      stopDaemon: vi.fn(),
    };
    router.setImplementationForTesting(mockImpl);

    // Act
    await router.saveConfig(configToSave);

    // Assert
    expect(mockImpl.saveConfig).toHaveBeenCalledWith(configToSave);
  });

  it('should delegate getStatus to active implementation when invoked', async () => {
    // Arrange
    const router = WorkflowRouter.getInstance();
    const expectedStatus: WorkflowStatus = {
      isDaemonRunning: true,
      lastCheckIso: '2026-10-19T09:00:00.000Z',
    };
    const mockImpl: IWorkflow = {
      getConfig: vi.fn(),
      saveConfig: vi.fn(),
      getStatus: vi.fn().mockResolvedValue(expectedStatus),
      checkRules: vi.fn(),
      startDaemon: vi.fn(),
      stopDaemon: vi.fn(),
    };
    router.setImplementationForTesting(mockImpl);

    // Act
    const status = await router.getStatus();

    // Assert
    expect(mockImpl.getStatus).toHaveBeenCalledTimes(1);
    expect(status).toEqual(expectedStatus);
  });

  it('should delegate checkRules with optional timestamp to active implementation', async () => {
    // Arrange
    const router = WorkflowRouter.getInstance();
    const expectedCheckResult: WorkflowCheckResult = {
      stopped: true,
      reason: 'hours_limit',
      warning: false,
    };
    const mockImpl: IWorkflow = {
      getConfig: vi.fn(),
      saveConfig: vi.fn(),
      getStatus: vi.fn(),
      checkRules: vi.fn().mockResolvedValue(expectedCheckResult),
      startDaemon: vi.fn(),
      stopDaemon: vi.fn(),
    };
    router.setImplementationForTesting(mockImpl);

    // Act
    const result = await router.checkRules('2026-10-19T17:00:00.000Z');

    // Assert
    expect(mockImpl.checkRules).toHaveBeenCalledWith('2026-10-19T17:00:00.000Z');
    expect(result).toEqual(expectedCheckResult);
  });

  it('should delegate startDaemon and stopDaemon to active implementation', async () => {
    // Arrange
    const router = WorkflowRouter.getInstance();
    const mockImpl: IWorkflow = {
      getConfig: vi.fn(),
      saveConfig: vi.fn(),
      getStatus: vi.fn(),
      checkRules: vi.fn(),
      startDaemon: vi.fn().mockResolvedValue(undefined),
      stopDaemon: vi.fn().mockResolvedValue(undefined),
    };
    router.setImplementationForTesting(mockImpl);

    // Act
    await router.startDaemon();
    await router.stopDaemon();

    // Assert
    expect(mockImpl.startDaemon).toHaveBeenCalledTimes(1);
    expect(mockImpl.stopDaemon).toHaveBeenCalledTimes(1);
  });
});

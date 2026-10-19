import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WorkflowPlugin, DEFAULT_WORKFLOW_CONFIG } from '@plugins/workflows/WorkflowPlugin';
import { IWorkflowRule } from '@common/workflows/IWorkflow';
import { EngineRouter } from '@common/engine/EngineRouter';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PluginRegistry } from '@plugins/PluginRegistry';
import { STORAGE_KEYS } from '@common/constants/storage-keys';
import { aWorkflowConfig, aTimeLog } from '@tests/shared/builders/entity-builders';
import { IEngine } from '@common/engine/IEngine';
import { IPersistence } from '@common/persistence/IPersistence';

describe('WorkflowPlugin', () => {
  let plugin: WorkflowPlugin;
  let mockStopTimer: ReturnType<typeof vi.fn>;
  let mockGetActiveLogs: ReturnType<typeof vi.fn>;
  let mockLoadState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    PluginRegistry.getInstance().reset();
    EngineRouter.resetForTesting();
    PersistenceRouter.resetForTesting();

    mockStopTimer = vi.fn().mockResolvedValue(undefined);
    mockGetActiveLogs = vi.fn().mockResolvedValue([]);
    mockLoadState = vi.fn().mockResolvedValue({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    const mockEngine = {
      timer: {
        startTimer: vi.fn(),
        stopTimer: mockStopTimer,
        resumeTimer: vi.fn(),
        getActiveLogs: mockGetActiveLogs,
      },
      metrics: {} as unknown,
      timeLogs: {} as unknown,
      validation: {} as unknown,
    } as unknown as IEngine;
    EngineRouter.getInstance().setImplementationForTesting(mockEngine);

    const mockPersistence = {
      core: {
        load: mockLoadState,
        overrideState: vi.fn(),
        reset: vi.fn(),
      },
    } as unknown as IPersistence;
    PersistenceRouter.getInstance().setImplementationForTesting(mockPersistence);

    plugin = new WorkflowPlugin();
  });

  afterEach(async () => {
    await plugin.stopDaemon();
    vi.restoreAllMocks();
  });

  it('should return default configuration when storage is empty', async () => {
    // Arrange: storage is empty

    // Act
    const config = await plugin.getConfig();

    // Assert
    expect(config).toEqual(DEFAULT_WORKFLOW_CONFIG);
  });

  it('should persist and retrieve updated configuration in localStorage', async () => {
    // Arrange
    const updatedConfig = aWorkflowConfig({
      autoStopHoursLimitEnabled: true,
      autoStopHoursLimit: 6,
      autoStopDailyBoundaryEnabled: true,
      autoStopDailyBoundaryTime: '18:00',
    });

    // Act
    await plugin.saveConfig(updatedConfig);
    const retrievedConfig = await plugin.getConfig();

    // Assert
    expect(retrievedConfig).toEqual(updatedConfig);
    expect(localStorage.getItem(STORAGE_KEYS.WORKFLOW_CONFIG)).toContain('"autoStopHoursLimit":6');
  });

  it('should return not stopped and false warning when there are no active logs', async () => {
    // Arrange
    mockGetActiveLogs.mockResolvedValue([]);

    // Act
    const result = await plugin.checkRules('2026-10-19T10:00:00.000Z');

    // Assert
    expect(result).toEqual({ stopped: false, warning: false });
    expect(mockStopTimer).not.toHaveBeenCalled();
  });

  it('should stop timer and emit workflow:autostop when continuous hours limit is reached or exceeded', async () => {
    // Arrange
    const config = aWorkflowConfig({
      autoStopHoursLimitEnabled: true,
      autoStopHoursLimit: 8,
    });
    await plugin.saveConfig(config);

    const activeLog = aTimeLog({
      id: 'active_1',
      startTime: '2026-10-19T08:00:00.000Z',
      endTime: null,
    });
    mockGetActiveLogs.mockResolvedValue(['active_1']);
    mockLoadState.mockResolvedValue({
      projects: [],
      tasks: [],
      logs: [activeLog],
      activeLog,
    });

    const eventSpy = vi.fn().mockResolvedValue(undefined);
    PluginRegistry.getInstance().registerHook({
      id: 'test-hook',
      name: 'Test Hook',
      onEvent: eventSpy,
    });

    // Act: 8 hours and 1 minute later
    const checkTime = '2026-10-19T16:01:00.000Z';
    const result = await plugin.checkRules(checkTime);

    // Assert
    expect(result.stopped).toBe(true);
    expect(result.reason).toBe('hours_limit');
    expect(mockStopTimer).toHaveBeenCalledTimes(1);
    expect(eventSpy).toHaveBeenCalledWith('workflow:autostop', {
      reason: 'hours_limit',
      timeIso: new Date(checkTime).toISOString(),
    });

    const status = await plugin.getStatus();
    expect(status.lastAutoStopReason).toBe('hours_limit');
  });

  it('should emit workflow:warning when within 15 minutes of continuous hours limit', async () => {
    // Arrange
    const config = aWorkflowConfig({
      autoStopHoursLimitEnabled: true,
      autoStopHoursLimit: 8,
      warningNotificationEnabled: true,
    });
    await plugin.saveConfig(config);

    const activeLog = aTimeLog({
      id: 'active_1',
      startTime: '2026-10-19T08:00:00.000Z',
      endTime: null,
    });
    mockGetActiveLogs.mockResolvedValue(['active_1']);
    mockLoadState.mockResolvedValue({
      projects: [],
      tasks: [],
      logs: [activeLog],
      activeLog,
    });

    const eventSpy = vi.fn().mockResolvedValue(undefined);
    PluginRegistry.getInstance().registerHook({
      id: 'test-hook',
      name: 'Test Hook',
      onEvent: eventSpy,
    });

    // Act: 7 hours and 50 minutes later (10 min before limit)
    const checkTime = '2026-10-19T15:50:00.000Z';
    const result = await plugin.checkRules(checkTime);

    // Assert
    expect(result.stopped).toBe(false);
    expect(result.warning).toBe(true);
    expect(mockStopTimer).not.toHaveBeenCalled();
    expect(eventSpy).toHaveBeenCalledWith('workflow:warning', {
      timeIso: new Date(checkTime).toISOString(),
    });
  });

  it('should stop timer when daily boundary time is crossed for a task started before boundary', async () => {
    // Arrange
    const nowLocal = new Date();
    const boundaryHours = (nowLocal.getHours() + 1) % 24;
    const boundaryTimeStr = `${String(boundaryHours).padStart(2, '0')}:00`;

    const config = aWorkflowConfig({
      autoStopDailyBoundaryEnabled: true,
      autoStopDailyBoundaryTime: boundaryTimeStr,
    });
    await plugin.saveConfig(config);

    const startDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), boundaryHours - 2, 0, 0);
    const activeLog = aTimeLog({
      id: 'active_1',
      startTime: startDate.toISOString(),
      endTime: null,
    });
    mockGetActiveLogs.mockResolvedValue(['active_1']);
    mockLoadState.mockResolvedValue({
      projects: [],
      tasks: [],
      logs: [activeLog],
      activeLog,
    });

    // Act: Check at boundary time + 5 minutes
    const checkDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), boundaryHours, 5, 0);
    const result = await plugin.checkRules(checkDate.toISOString());

    // Assert
    expect(result.stopped).toBe(true);
    expect(result.reason).toBe('daily_boundary');
    expect(mockStopTimer).toHaveBeenCalledTimes(1);
  });

  it('should not stop timer when daily boundary was already past when timer started', async () => {
    // Arrange
    const nowLocal = new Date();
    const boundaryHours = Math.max(0, nowLocal.getHours() - 2);
    const boundaryTimeStr = `${String(boundaryHours).padStart(2, '0')}:00`;

    const config = aWorkflowConfig({
      autoStopDailyBoundaryEnabled: true,
      autoStopDailyBoundaryTime: boundaryTimeStr,
    });
    await plugin.saveConfig(config);

    // Timer was started 1 hour AFTER boundary
    const startDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), boundaryHours + 1, 0, 0);
    const activeLog = aTimeLog({
      id: 'active_1',
      startTime: startDate.toISOString(),
      endTime: null,
    });
    mockGetActiveLogs.mockResolvedValue(['active_1']);
    mockLoadState.mockResolvedValue({
      projects: [],
      tasks: [],
      logs: [activeLog],
      activeLog,
    });

    // Act: Check 30 minutes after start
    const checkDate = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate(), boundaryHours + 1, 30, 0);
    const result = await plugin.checkRules(checkDate.toISOString());

    // Assert
    expect(result.stopped).toBe(false);
    expect(mockStopTimer).not.toHaveBeenCalled();
  });

  it('should update daemon running state to true when startDaemon is called', async () => {
    // Arrange: daemon is stopped initially

    // Act
    await plugin.startDaemon();
    const runningStatus = await plugin.getStatus();

    // Assert
    expect(runningStatus.isDaemonRunning).toBe(true);
  });

  it('should update daemon running state to false when stopDaemon is called', async () => {
    // Arrange
    await plugin.startDaemon();

    // Act
    await plugin.stopDaemon();
    const stoppedStatus = await plugin.getStatus();

    // Assert
    expect(stoppedStatus.isDaemonRunning).toBe(false);
  });

  it('should evaluate custom injected rule when checkRules is executed', async () => {
    // Arrange
    const customRule: IWorkflowRule = {
      id: 'custom_rule',
      evaluate: vi.fn().mockReturnValue({ stopped: true, reason: 'custom_stop', warning: false }),
    };
    const customPlugin = new WorkflowPlugin([customRule]);
    const activeLog = aTimeLog({ id: 'active_1', startTime: '2026-10-19T08:00:00.000Z', endTime: null });
    mockGetActiveLogs.mockResolvedValue(['active_1']);
    mockLoadState.mockResolvedValue({
      projects: [],
      tasks: [],
      logs: [activeLog],
      activeLog,
    });

    // Act
    const result = await customPlugin.checkRules('2026-10-19T10:00:00.000Z');

    // Assert
    expect(result.stopped).toBe(true);
    expect(result.reason).toBe('custom_stop');
    expect(customRule.evaluate).toHaveBeenCalledTimes(1);
    expect(mockStopTimer).toHaveBeenCalledTimes(1);
  });
});

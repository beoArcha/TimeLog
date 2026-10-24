import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCliCommand } from '@features/cli/utils/cliEngine';
import { CliRouter } from '@common/cli/CliRouter';
import { ICliClient } from '@common/cli/ICliClient';
import { CliEngineContext } from '@features/cli/types';
import { SandboxEmulatorStore } from '@features/cli/sandbox/sandboxEmulatorStore';

describe('cliNativeDelegation', () => {
  let mockContext: CliEngineContext;
  let mockNativeClient: ICliClient;
  const onRefreshDataMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    CliRouter.resetForTesting();
    SandboxEmulatorStore.getInstance().disable();

    mockNativeClient = {
      execute: vi.fn(),
    };
    CliRouter.getInstance().setImplementationForTesting(mockNativeClient);

    mockContext = {
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
      metrics: null,
      nowIso: '2026-10-24T20:00:00Z',
      locale: 'en',
      customTranslations: null,
      holidays: [],
      setHolidays: vi.fn(),
      selectedTaskId: null,
      setSelectedTaskId: vi.fn(),
      onAddProject: vi.fn(),
      onRenameProject: vi.fn(),
      onAddTask: vi.fn(),
      onRenameTask: vi.fn(),
      onToggleTaskComplete: vi.fn(),
      onStartTimer: vi.fn(),
      onStopTimer: vi.fn(),
      onRefreshData: onRefreshDataMock,
      isSandbox: false,
    };
  });

  it('should delegate command to native CLI and trigger onRefreshData on success', async () => {
    // Arrange
    vi.mocked(mockNativeClient.execute).mockResolvedValueOnce({
      success: true,
      stdout: 'Started task_1',
      exit_code: 0,
      envelope: null,
    });

    // Act
    const lines = await executeCliCommand('start task_1', mockContext);

    // Assert
    expect(mockNativeClient.execute).toHaveBeenCalledWith('start task_1');
    expect(onRefreshDataMock).toHaveBeenCalled();
    expect(lines).toEqual(
      expect.arrayContaining([
        { text: 'user@logtime-by-oxyflow:~$ start task_1', type: 'input' },
        { text: 'Started task_1', type: 'success' },
      ])
    );
  });

  it('should render error lines when native CLI returns failure', async () => {
    // Arrange
    vi.mocked(mockNativeClient.execute).mockResolvedValueOnce({
      success: false,
      stdout: 'Error: No active timer found\nRun start <task> to begin tracking',
      exit_code: 5,
      envelope: {
        code: 'ENG_TIMER_INACTIVE',
        category: 'ENGINE_CONFLICT',
        exit_code: 5,
        timestamp: '2026-10-24T20:00:00Z',
        technical: 'No active timer found',
        user: null,
      },
    });

    // Act
    const lines = await executeCliCommand('stop', mockContext);

    // Assert
    expect(mockNativeClient.execute).toHaveBeenCalledWith('stop');
    expect(onRefreshDataMock).not.toHaveBeenCalled();
    expect(lines).toEqual(
      expect.arrayContaining([
        { text: 'user@logtime-by-oxyflow:~$ stop', type: 'input' },
        { text: 'Error: No active timer found', type: 'error' },
        { text: 'Run start <task> to begin tracking', type: 'error' },
      ])
    );
  });

  it('should clear terminal history without invoking native CLI when command is clear', async () => {
    // Arrange & Act
    const lines = await executeCliCommand('clear', mockContext);

    // Assert
    expect(mockNativeClient.execute).not.toHaveBeenCalled();
    expect(lines).toEqual([{ text: '__CLEAR__', type: 'info' }]);
  });

  it('should delegate to local sandbox manager when command is sandbox', async () => {
    // Arrange & Act
    const lines = await executeCliCommand('sandbox on', mockContext);

    // Assert
    expect(mockNativeClient.execute).not.toHaveBeenCalled();
    expect(lines).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'success', text: expect.stringContaining('[SANDBOX]') }),
      ])
    );
  });

  it('should bypass native CLI when in sandbox mode', async () => {
    // Arrange
    mockContext.isSandbox = true;

    // Act
    await executeCliCommand('status', mockContext);

    // Assert
    expect(mockNativeClient.execute).not.toHaveBeenCalled();
  });
});

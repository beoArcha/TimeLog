import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { EngineCommands } from '@common/engine/EngineCommands';
import { ErrorHandler } from '@common/exceptions';

describe('Unit Tests: EngineCommands', () => {
  let commands: EngineCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    commands = new EngineCommands();
  });

  it('should call start_timer command and handle errors', async () => {
    // Arrange & Act
    mockInvoke.mockResolvedValue(undefined);
    await commands.startTimer('task-123');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('start_timer', { taskId: 'task-123' });

    // Error branch
    mockInvoke.mockRejectedValue(new Error('Start error'));
    await expect(commands.startTimer('task-123')).rejects.toThrow('Start error');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });

  it('should call stop_timer command with or without projectId', async () => {
    // Arrange & Act
    mockInvoke.mockResolvedValue(undefined);
    await commands.stopTimer('project-456');
    await commands.stopTimer();

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('stop_timer', { projectId: 'project-456' });
    expect(mockInvoke).toHaveBeenCalledWith('stop_timer', { projectId: undefined });

    // Error branch
    mockInvoke.mockRejectedValue(new Error('Stop error'));
    await expect(commands.stopTimer('project-456')).rejects.toThrow('Stop error');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });

  it('should call resume_timer command and handle errors', async () => {
    // Arrange & Act
    mockInvoke.mockResolvedValue(undefined);
    await commands.resumeTimer('task-123');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('resume_timer', { taskId: 'task-123' });

    // Error branch
    mockInvoke.mockRejectedValue(new Error('Resume error'));
    await expect(commands.resumeTimer('task-123')).rejects.toThrow('Resume error');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });

  it('should call get_active_logs command and handle errors', async () => {
    // Arrange & Act
    mockInvoke.mockResolvedValue(['log-1', 'log-2']);
    const activeLogs = await commands.getActiveLogs();

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_active_logs');
    expect(activeLogs).toEqual(['log-1', 'log-2']);

    // Error branch
    mockInvoke.mockRejectedValue(new Error('Active logs error'));
    await expect(commands.getActiveLogs()).rejects.toThrow('Active logs error');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });

  it('should call get_task_elapsed command and handle errors', async () => {
    // Arrange & Act
    mockInvoke.mockResolvedValue(1234);
    const result = await commands.getTaskElapsed('task-123', '2026-06-15T12:00:00Z');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_task_elapsed', { taskId: 'task-123', nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toBe(1234);

    // Error branch
    mockInvoke.mockRejectedValue(new Error('Task elapsed error'));
    await expect(commands.getTaskElapsed('task-123')).rejects.toThrow('Task elapsed error');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });

  it('should call get_project_elapsed command and handle errors', async () => {
    // Arrange & Act
    mockInvoke.mockResolvedValue(5678);
    const result = await commands.getProjectElapsed('proj-1', '2026-06-15T12:00:00Z');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_project_elapsed', { projectId: 'proj-1', nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toBe(5678);

    // Error branch
    mockInvoke.mockRejectedValue(new Error('Project elapsed error'));
    await expect(commands.getProjectElapsed('proj-1')).rejects.toThrow('Project elapsed error');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });

  it('should call get_elapsed_range command and handle errors', async () => {
    // Arrange & Act
    const filter = { from: '2026-06-15T00:00:00Z', to: '2026-06-15T23:59:59Z' };
    mockInvoke.mockResolvedValue(9999);
    const result = await commands.getElapsedRange(filter, '2026-06-15T12:00:00Z');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_elapsed_range', { range: filter, nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toBe(9999);

    // Error branch
    mockInvoke.mockRejectedValue(new Error('Elapsed range error'));
    await expect(commands.getElapsedRange(filter)).rejects.toThrow('Elapsed range error');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });

  it('should call get_computed_metrics command and handle errors', async () => {
    // Arrange & Act
    const mockMetrics = { snapshotNowIso: '2026-06-15T12:00:00Z', tasks: {}, projects: {} };
    mockInvoke.mockResolvedValue(mockMetrics);
    const result = await commands.getComputedMetrics('2026-06-15T12:00:00Z');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_computed_metrics', { nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toEqual(mockMetrics);

    // Error branch
    mockInvoke.mockRejectedValue(new Error('Metrics error'));
    await expect(commands.getComputedMetrics()).rejects.toThrow('Metrics error');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });

  it('should call edit_time_log command and handle errors', async () => {
    // Arrange & Act
    mockInvoke.mockResolvedValue(undefined);
    await commands.editTimeLog('log-1', 'task-1', '2026-06-15T10:00:00Z', '2026-06-15T11:00:00Z', 'Note', 'Reason');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('edit_time_log', {
      id: 'log-1',
      taskId: 'task-1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
      note: 'Note',
      reason: 'Reason',
    });

    // Error branch
    mockInvoke.mockRejectedValue(new Error('Edit error'));
    await expect(
      commands.editTimeLog('log-1', 'task-1', '2026-06-15T10:00:00Z', null, null, null)
    ).rejects.toThrow('Edit error');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });

  it('should call get_project_statistics command and handle errors', async () => {
    // Arrange & Act
    const mockStats = { totalDurationSec: 3600, totalTasks: 5, completedTasks: 3 };
    mockInvoke.mockResolvedValue(mockStats);
    const result = await commands.getProjectStatistics('proj-1');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_project_statistics', { projectId: 'proj-1' });
    expect(result).toEqual(mockStats);

    // Error branch
    mockInvoke.mockRejectedValue(new Error('Statistics error'));
    await expect(commands.getProjectStatistics('proj-1')).rejects.toThrow('Statistics error');
    expect(ErrorHandler.handle).toHaveBeenCalled();
  });
});

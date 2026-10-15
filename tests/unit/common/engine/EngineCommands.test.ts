import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { EngineCommands } from '@common/engine/EngineCommands';

describe('Unit Tests: EngineCommands', () => {
  let commands: EngineCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    commands = new EngineCommands();
  });

  it('should call start_timer command', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await commands.startTimer('task-123');
    expect(mockInvoke).toHaveBeenCalledWith('start_timer', { taskId: 'task-123' });
  });

  it('should call stop_timer command', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await commands.stopTimer('project-456');
    expect(mockInvoke).toHaveBeenCalledWith('stop_timer', { projectId: 'project-456' });
  });

  it('should call resume_timer command', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await commands.resumeTimer('task-123');
    expect(mockInvoke).toHaveBeenCalledWith('resume_timer', { taskId: 'task-123' });
  });

  it('should call get_task_elapsed command', async () => {
    mockInvoke.mockResolvedValue(1234);
    const result = await commands.getTaskElapsed('task-123', '2026-06-15T12:00:00Z');
    expect(mockInvoke).toHaveBeenCalledWith('get_task_elapsed', { taskId: 'task-123', nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toBe(1234);
  });

  it('should call get_project_elapsed command', async () => {
    mockInvoke.mockResolvedValue(5678);
    const result = await commands.getProjectElapsed('proj-1', '2026-06-15T12:00:00Z');
    expect(mockInvoke).toHaveBeenCalledWith('get_project_elapsed', { projectId: 'proj-1', nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toBe(5678);
  });

  it('should call get_computed_metrics command', async () => {
    const mockMetrics = { snapshotNowIso: '2026-06-15T12:00:00Z', tasks: {}, projects: {} };
    mockInvoke.mockResolvedValue(mockMetrics);
    const result = await commands.getComputedMetrics('2026-06-15T12:00:00Z');
    expect(mockInvoke).toHaveBeenCalledWith('get_computed_metrics', { nowIso: '2026-06-15T12:00:00Z' });
    expect(result).toEqual(mockMetrics);
  });

  it('should call edit_time_log command', async () => {
    mockInvoke.mockResolvedValue(undefined);
    await commands.editTimeLog('log-1', 'task-1', '2026-06-15T10:00:00Z', '2026-06-15T11:00:00Z', 'Note', 'Reason');
    expect(mockInvoke).toHaveBeenCalledWith('edit_time_log', {
      id: 'log-1',
      taskId: 'task-1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
      note: 'Note',
      reason: 'Reason',
    });
  });

  it('should call get_project_statistics command', async () => {
    const mockStats = { totalDurationSec: 3600, totalTasks: 5, completedTasks: 3 };
    mockInvoke.mockResolvedValue(mockStats);
    const result = await commands.getProjectStatistics('proj-1');
    expect(mockInvoke).toHaveBeenCalledWith('get_project_statistics', { projectId: 'proj-1' });
    expect(result).toEqual(mockStats);
  });

  it('should propagate errors correctly', async () => {
    mockInvoke.mockRejectedValue(new Error('Tauri Invoke Error'));
    await expect(commands.startTimer('task-123')).rejects.toThrow('Tauri Invoke Error');
  });
});

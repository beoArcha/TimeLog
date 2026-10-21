import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TauriTimerEngine } from '@common/engine/commands/TauriTimerEngine';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('TauriTimerEngine', () => {
  let engine: TauriTimerEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new TauriTimerEngine();
  });

  it('should invoke start_timer when startTimer is called', async () => {
    // Arrange
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    // Act
    await engine.startTimer('task-123');

    // Assert
    expect(invoke).toHaveBeenCalledWith('start_timer', { taskId: 'task-123' });
  });

  it('should invoke stop_timer when stopTimer is called', async () => {
    // Arrange
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    // Act
    await engine.stopTimer('project-456');

    // Assert
    expect(invoke).toHaveBeenCalledWith('stop_timer', { projectId: 'project-456' });
  });

  it('should invoke resume_timer when resumeTimer is called', async () => {
    // Arrange
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    // Act
    await engine.resumeTimer('task-123');

    // Assert
    expect(invoke).toHaveBeenCalledWith('resume_timer', { taskId: 'task-123' });
  });

  it('should invoke get_active_logs and return active log IDs', async () => {
    // Arrange
    vi.mocked(invoke).mockResolvedValueOnce(['log-1', 'log-2']);

    // Act
    const result = await engine.getActiveLogs();

    // Assert
    expect(invoke).toHaveBeenCalledWith('get_active_logs');
    expect(result).toEqual(['log-1', 'log-2']);
  });

  it('should throw exception when invoke fails', async () => {
    // Arrange
    vi.mocked(invoke).mockRejectedValueOnce(new Error('IPC network error'));

    // Act & Assert
    await expect(engine.startTimer('task-err')).rejects.toThrow('IPC network error');
  });
});

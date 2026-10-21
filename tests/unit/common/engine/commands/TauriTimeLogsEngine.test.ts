import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TauriTimeLogsEngine } from '@common/engine/commands/TauriTimeLogsEngine';
import { invoke } from '@tauri-apps/api/core';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('TauriTimeLogsEngine', () => {
  let engine: TauriTimeLogsEngine;

  beforeEach(() => {
    vi.clearAllMocks();
    engine = new TauriTimeLogsEngine();
  });

  it('should invoke edit_time_log when editTimeLog is called with valid payload', async () => {
    // Arrange
    vi.mocked(invoke).mockResolvedValueOnce(undefined);

    // Act
    await engine.editTimeLog(
      'log-1',
      'task-1',
      '2026-06-15T10:00:00Z',
      '2026-06-15T11:00:00Z',
      'Worked on unit tests',
      'Fixed typo'
    );

    // Assert
    expect(invoke).toHaveBeenCalledWith('edit_time_log', {
      id: 'log-1',
      taskId: 'task-1',
      startTime: '2026-06-15T10:00:00Z',
      endTime: '2026-06-15T11:00:00Z',
      note: 'Worked on unit tests',
      reason: 'Fixed typo',
    });
  });

  it('should throw exception when invoke fails', async () => {
    // Arrange
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Backend validation failed'));

    // Act & Assert
    await expect(
      engine.editTimeLog('log-1', 'task-1', '2026-06-15T10:00:00Z', null, null, null)
    ).rejects.toThrow('Backend validation failed');
  });
});

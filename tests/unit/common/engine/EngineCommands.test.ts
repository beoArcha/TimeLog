import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '../../../shared/test-helpers';
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

  it('should propagate errors correctly', async () => {
    mockInvoke.mockRejectedValue(new Error('Tauri Invoke Error'));
    await expect(commands.startTimer('task-123')).rejects.toThrow('Tauri Invoke Error');
  });
});

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

  it('should call add_project and return repository state', async () => {
    const mockState = { projects: [], tasks: [], logs: [], activeLog: null };
    mockInvoke.mockResolvedValue(mockState);
    const result = await commands.addProject({ name: 'New Proj', color: '#ff0000' });
    expect(mockInvoke).toHaveBeenCalledWith('add_project', {
      name: 'New Proj',
      color: '#ff0000',
      description: null,
      icon: null,
      tags: null,
    });
    expect(result).toEqual(mockState);
  });

  it('should call add_task and return repository state', async () => {
    const mockState = { projects: [], tasks: [], logs: [], activeLog: null };
    mockInvoke.mockResolvedValue(mockState);
    const result = await commands.addTask({ projectId: 'p1', name: 'Task 1' });
    expect(mockInvoke).toHaveBeenCalledWith('add_task', {
      projectId: 'p1',
      name: 'Task 1',
      parentTaskId: null,
    });
    expect(result).toEqual(mockState);
  });

  it('should call get_settings and return settings', async () => {
    const mockSettings = { soundAlerts: false, timeRounding: 0, launchAtStartup: false, dynamicTheme: false };
    mockInvoke.mockResolvedValue(mockSettings);
    const result = await commands.getSettings();
    expect(mockInvoke).toHaveBeenCalledWith('get_settings');
    expect(result).toEqual(mockSettings);
  });

  it('should propagate errors correctly', async () => {
    mockInvoke.mockRejectedValue(new Error('Tauri Invoke Error'));
    await expect(commands.startTimer('task-123')).rejects.toThrow('Tauri Invoke Error');
  });
});

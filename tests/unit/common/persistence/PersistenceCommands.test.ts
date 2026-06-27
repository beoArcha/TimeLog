import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '../../../shared/test-helpers';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';

describe('Unit Tests: PersistenceCommands', () => {
  let commands: PersistenceCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    commands = new PersistenceCommands();
  });

  it('should call get_timer_state on load', async () => {
    const mockState = { projects: [{ id: 'p1' }], tasks: [] };
    mockInvoke.mockResolvedValue(mockState);

    const result = await commands.load();
    expect(mockInvoke).toHaveBeenCalledWith('get_timer_state');
    expect(result).toEqual(mockState);
  });

  it('should propagate errors correctly', async () => {
    mockInvoke.mockRejectedValue(new Error('Tauri Error'));
    await expect(commands.load()).rejects.toThrow('Tauri Error');
  });

  it('should call add_project', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.addProject({ name: 'Project 1', color: 'red' });
    expect(mockInvoke).toHaveBeenCalledWith('add_project', { name: 'Project 1', color: 'red' });
  });

  it('should call toggle_project_archive', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.toggleProjectArchive('p1');
    expect(mockInvoke).toHaveBeenCalledWith('toggle_project_archive', { projectId: 'p1' });
  });

  it('should call add_task', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.addTask({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    expect(mockInvoke).toHaveBeenCalledWith('add_task', {
      projectId: 'p1',
      name: 'Task 1',
      parentTaskId: null,
    });
  });

  it('should call rename_project', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.renameProject('p1', 'New Project Name');
    expect(mockInvoke).toHaveBeenCalledWith('rename_project', { projectId: 'p1', name: 'New Project Name' });
  });

  it('should call rename_task', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.renameTask('t1', 'New Task Name');
    expect(mockInvoke).toHaveBeenCalledWith('rename_task', { taskId: 't1', name: 'New Task Name' });
  });

  it('should call delete_task', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.deleteTask('t1');
    expect(mockInvoke).toHaveBeenCalledWith('delete_task', { taskId: 't1' });
  });

  it('should call toggle_task_complete', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.toggleTaskComplete('t1');
    expect(mockInvoke).toHaveBeenCalledWith('toggle_task_complete', { taskId: 't1' });
  });

  it('should call start_timer and stop_timer (temporary compatibility)', async () => {
    mockInvoke.mockResolvedValue({ activeLog: null, projects: [], tasks: [], logs: [] });
    await commands.startTimer('t1');
    expect(mockInvoke).toHaveBeenCalledWith('start_timer', { taskId: 't1' });

    mockInvoke.mockResolvedValue({ activeLog: null, projects: [], tasks: [], logs: [] });
    await commands.stopTimer('p1');
    expect(mockInvoke).toHaveBeenCalledWith('stop_timer', { projectId: 'p1' });
  });

  it('should call reset_database on reset', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.reset();
    expect(mockInvoke).toHaveBeenCalledWith('reset_database');
  });
});

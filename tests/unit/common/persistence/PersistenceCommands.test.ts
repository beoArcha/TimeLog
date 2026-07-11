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

    const result = await commands.core.load();
    expect(mockInvoke).toHaveBeenCalledWith('get_timer_state');
    expect(result).toEqual(mockState);
  });

  it('should propagate errors correctly', async () => {
    mockInvoke.mockRejectedValue(new Error('Tauri Error'));
    await expect(commands.core.load()).rejects.toThrow('Tauri Error');
  });

  it('should call add_project', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.projects.add({ name: 'Project 1', color: 'red' });
    expect(mockInvoke).toHaveBeenCalledWith('add_project', { name: 'Project 1', color: 'red' });
  });

  it('should call toggle_project_archive', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.projects.toggleArchive('p1');
    expect(mockInvoke).toHaveBeenCalledWith('toggle_project_archive', { projectId: 'p1' });
  });

  it('should call add_task', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    expect(mockInvoke).toHaveBeenCalledWith('add_task', {
      projectId: 'p1',
      name: 'Task 1',
      parentTaskId: null,
    });
  });

  it('should call rename_project', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.projects.rename('p1', 'New Project Name');
    expect(mockInvoke).toHaveBeenCalledWith('rename_project', { projectId: 'p1', name: 'New Project Name' });
  });

  it('should call rename_task', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.tasks.rename('t1', 'New Task Name');
    expect(mockInvoke).toHaveBeenCalledWith('rename_task', { taskId: 't1', name: 'New Task Name' });
  });

  it('should call delete_task', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.tasks.delete('t1');
    expect(mockInvoke).toHaveBeenCalledWith('delete_task', { taskId: 't1' });
  });

  it('should call toggle_task_complete', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.tasks.toggleComplete('t1');
    expect(mockInvoke).toHaveBeenCalledWith('toggle_task_complete', { taskId: 't1' });
  });

  it('should call reset_database on reset', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.core.reset();
    expect(mockInvoke).toHaveBeenCalledWith('reset_database');
  });
});

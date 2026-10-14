import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';

describe('Unit Tests: PersistenceCommands', () => {
  let commands: PersistenceCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    commands = new PersistenceCommands();
  });

  it('should call get_state on load', async () => {
    const mockState = { projects: [{ id: 'p1' }], tasks: [] };
    mockInvoke.mockResolvedValue(mockState);

    const result = await commands.core.load();
    expect(mockInvoke).toHaveBeenCalledWith('get_state');
    expect(result).toEqual(mockState);
  });

  it('should propagate errors correctly', async () => {
    mockInvoke.mockRejectedValue(new Error('Tauri Error'));
    await expect(commands.core.load()).rejects.toThrow('Tauri Error');
  });

  it('should call add', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.projects.add({ name: 'Project 1', color: 'red' });
    expect(mockInvoke).toHaveBeenCalledWith('add', {
      name: 'Project 1',
      color: 'red',
      description: null,
      icon: null,
      tags: null,
    });
  });

  it('should call toggle_archive', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.projects.toggleArchive('p1');
    expect(mockInvoke).toHaveBeenCalledWith('toggle_archive', { projectId: 'p1' });
  });

  it('should call create', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    expect(mockInvoke).toHaveBeenCalledWith('create', {
      projectId: 'p1',
      name: 'Task 1',
      parentTaskId: null,
    });
  });

  it('should call update_project on update and rename', async () => {
    const mockState = {
      projects: [{ id: 'p1', name: 'Old', color: '#ff0000', description: null, icon: null, tags: null }],
      tasks: [],
      logs: [],
      activeLog: null
    };
    mockInvoke.mockResolvedValue(mockState);
    await commands.projects.update('p1', 'New Name', '#00ff00', null, null, null);
    expect(mockInvoke).toHaveBeenCalledWith('update_project', {
      projectId: 'p1',
      name: 'New Name',
      color: '#00ff00',
      description: null,
      icon: null,
      tags: null,
    });

    await commands.projects.rename('p1', 'Renamed');
    expect(mockInvoke).toHaveBeenCalledWith('update_project', {
      projectId: 'p1',
      name: 'Renamed',
      color: '#ff0000',
      description: null,
      icon: null,
      tags: null,
    });
  });

  it('should call update_task on update and rename', async () => {
    const mockState = {
      projects: [],
      tasks: [{ id: 't1', name: 'Old Task', projectId: 'p1', parentTaskId: null, status: null, completed: false }],
      logs: [],
      activeLog: null
    };
    mockInvoke.mockResolvedValue(mockState);
    await commands.tasks.update('t1', 'New Task', null, 'Todo', false);
    expect(mockInvoke).toHaveBeenCalledWith('update_task', {
      taskId: 't1',
      name: 'New Task',
      parentTaskId: null,
      status: 'Todo',
      completed: false,
    });

    await commands.tasks.rename('t1', 'Renamed Task');
    expect(mockInvoke).toHaveBeenCalledWith('update_task', {
      taskId: 't1',
      name: 'Renamed Task',
      parentTaskId: null,
      status: null,
      completed: false,
    });
  });

  it('should call delete', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.tasks.delete('t1');
    expect(mockInvoke).toHaveBeenCalledWith('delete', { taskId: 't1' });
  });

  it('should call toggle_complete', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.tasks.toggleComplete('t1');
    expect(mockInvoke).toHaveBeenCalledWith('toggle_complete', { taskId: 't1' });
  });

  it('should call reset on reset', async () => {
    mockInvoke.mockResolvedValue({});
    await commands.core.reset();
    expect(mockInvoke).toHaveBeenCalledWith('reset');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { TauriTasksPersistence } from '@common/persistence/commands/TauriTasksPersistence';
import { aTask } from '@tests/shared/builders/entity-builders';

describe('TauriTasksPersistence', () => {
  let tasksPersistence: TauriTasksPersistence;

  beforeEach(() => {
    vi.clearAllMocks();
    tasksPersistence = new TauriTasksPersistence();
  });

  it('should invoke create command with normalized task parameters when adding task', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await tasksPersistence.add({
      projectId: 'proj-1',
      name: 'Task 1',
      parentTaskId: null,
    });

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('create', {
      projectId: 'proj-1',
      name: 'Task 1',
      parentTaskId: null,
      hourlyRate: null,
    });
  });

  it('should invoke update_task command when updating task', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await tasksPersistence.update('task-1', 'Updated Task', 'parent-1', 'InProgress', false);

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('update_task', {
      taskId: 'task-1',
      name: 'Updated Task',
      parentTaskId: 'parent-1',
      status: 'InProgress',
      completed: false,
    });
  });

  it('should invoke update_task command with hourlyRate when provided', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await tasksPersistence.update('task-1', 'Updated Task', 'parent-1', 'InProgress', false, '150.00');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('update_task', {
      taskId: 'task-1',
      name: 'Updated Task',
      parentTaskId: 'parent-1',
      status: 'InProgress',
      completed: false,
      hourlyRate: '150.00',
    });
  });

  it('should invoke rename_task command when renaming task', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await tasksPersistence.rename('task-1', 'New Name');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('rename_task', {
      taskId: 'task-1',
      name: 'New Name',
    });
  });

  it('should invoke delete command with task id when deleting task', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await tasksPersistence.delete('task-to-delete');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('delete', { taskId: 'task-to-delete' });
  });

  it('should invoke toggle_complete command when toggling completion', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await tasksPersistence.toggleComplete('task-1');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('toggle_complete', { taskId: 'task-1' });
  });

  it('should return project id from get_task_project_id IPC call when task exists', async () => {
    // Arrange
    mockInvoke.mockResolvedValueOnce('p-42');

    // Act
    const projectId = await tasksPersistence.getProjectId('t-10');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_task_project_id', { taskId: 't-10' });
    expect(projectId).toBe('p-42');
  });

  it('should throw error when getProjectId is called for non-existent task', async () => {
    // Arrange
    mockInvoke.mockRejectedValueOnce(new Error('Task missing-task not found'));

    // Act & Assert
    await expect(tasksPersistence.getProjectId('missing-task')).rejects.toThrow(
      'Task missing-task not found'
    );
  });

  it('should return subtasks from get_subtasks IPC call', async () => {
    // Arrange
    const child1 = aTask({ id: 'child-1', parentTaskId: 'parent-1' });
    const child2 = aTask({ id: 'child-2', parentTaskId: 'parent-1' });
    mockInvoke.mockResolvedValueOnce([child1, child2]);

    // Act
    const subtasks = await tasksPersistence.getSubtasks('parent-1');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('get_subtasks', { taskId: 'parent-1' });
    expect(subtasks).toHaveLength(2);
    expect(subtasks.map((t) => t.id)).toEqual(['child-1', 'child-2']);
  });
});

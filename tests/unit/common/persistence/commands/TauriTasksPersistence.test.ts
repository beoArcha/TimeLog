import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { TauriTasksPersistence } from '@common/persistence/commands/TauriTasksPersistence';
import { ICorePersistence } from '@common/persistence/IPersistence';
import { aTask } from '@tests/shared/builders/entity-builders';

describe('TauriTasksPersistence', () => {
  let coreMock: ICorePersistence;
  let tasksPersistence: TauriTasksPersistence;

  beforeEach(() => {
    vi.clearAllMocks();
    coreMock = {
      load: vi.fn(),
      overrideState: vi.fn(),
      reset: vi.fn(),
    };
    tasksPersistence = new TauriTasksPersistence(coreMock);
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

  it('should preserve task hierarchy and status when renaming task', async () => {
    // Arrange
    const existingTask = aTask({
      id: 'task-1',
      name: 'Old Name',
      parentTaskId: 'parent-1',
      status: 'InProgress',
      completed: false,
    });
    vi.mocked(coreMock.load).mockResolvedValueOnce({
      projects: [],
      tasks: [existingTask],
      logs: [],
      activeLog: null,
    });
    mockInvoke.mockResolvedValueOnce({ projects: [], tasks: [], logs: [], activeLog: null });

    // Act
    await tasksPersistence.rename('task-1', 'New Name');

    // Assert
    expect(mockInvoke).toHaveBeenCalledWith('update_task', {
      taskId: 'task-1',
      name: 'New Name',
      parentTaskId: 'parent-1',
      status: 'InProgress',
      completed: false,
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

  it('should return project id from loaded state when task exists', async () => {
    // Arrange
    const task = aTask({ id: 't-10', projectId: 'p-42' });
    vi.mocked(coreMock.load).mockResolvedValueOnce({
      projects: [],
      tasks: [task],
      logs: [],
      activeLog: null,
    });

    // Act
    const projectId = await tasksPersistence.getProjectId('t-10');

    // Assert
    expect(projectId).toBe('p-42');
  });

  it('should throw error when getProjectId is called for non-existent task', async () => {
    // Arrange
    vi.mocked(coreMock.load).mockResolvedValueOnce({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Act & Assert
    await expect(tasksPersistence.getProjectId('missing-task')).rejects.toThrow(
      'Task missing-task not found'
    );
  });

  it('should return subtasks filtering by parentTaskId', async () => {
    // Arrange
    const parent = aTask({ id: 'parent-1', parentTaskId: null });
    const child1 = aTask({ id: 'child-1', parentTaskId: 'parent-1' });
    const child2 = aTask({ id: 'child-2', parentTaskId: 'parent-1' });
    const other = aTask({ id: 'child-3', parentTaskId: 'other-parent' });
    vi.mocked(coreMock.load).mockResolvedValueOnce({
      projects: [],
      tasks: [parent, child1, child2, other],
      logs: [],
      activeLog: null,
    });

    // Act
    const subtasks = await tasksPersistence.getSubtasks('parent-1');

    // Assert
    expect(subtasks).toHaveLength(2);
    expect(subtasks.map((t) => t.id)).toEqual(['child-1', 'child-2']);
  });
});

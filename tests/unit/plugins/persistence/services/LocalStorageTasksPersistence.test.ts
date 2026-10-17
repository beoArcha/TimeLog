import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageTasksPersistence } from '@plugins/persistence/services/LocalStorageTasksPersistence';
import { ILocalStorageStateStore } from '@plugins/persistence/services/LocalStorageStateStore';
import { aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('LocalStorageTasksPersistence', () => {
  let storeMock: ILocalStorageStateStore;
  let tasksPersistence: LocalStorageTasksPersistence;

  beforeEach(() => {
    vi.clearAllMocks();
    storeMock = {
      load: vi.fn(),
      save: vi.fn().mockImplementation(async (s) => s),
      reset: vi.fn(),
      getStateOrDefault: vi.fn().mockResolvedValue({
        projects: [],
        tasks: [],
        logs: [],
        activeLog: null,
      }),
    };
    tasksPersistence = new LocalStorageTasksPersistence(storeMock);
  });

  it('should add task to state when hierarchy is valid', async () => {
    // Act
    const result = await tasksPersistence.add({
      projectId: 'proj-1',
      name: 'New Task',
      parentTaskId: null,
    });

    // Assert
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].name).toBe('New Task');
    expect(result.tasks[0].status).toBe('Todo');
  });

  it('should throw exception when updating task with circular reference or depth > 1', async () => {
    // Arrange
    const parent = aTask({ id: 'parent-1', parentTaskId: 'grandparent-1' });
    const task = aTask({ id: 'task-1', parentTaskId: null });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValue({
      projects: [],
      tasks: [parent, task],
      logs: [],
      activeLog: null,
    });

    // Act & Assert
    await expect(
      tasksPersistence.update('task-1', 'Self Parent', 'task-1', null, null)
    ).rejects.toThrow();

    await expect(
      tasksPersistence.update('task-1', 'Deep Parent', 'parent-1', null, null)
    ).rejects.toThrow();
  });

  it('should cascade delete subtasks and related time logs', async () => {
    // Arrange
    const parent = aTask({ id: 'parent-1' });
    const child = aTask({ id: 'child-1', parentTaskId: 'parent-1' });
    const other = aTask({ id: 'other-1', parentTaskId: null });
    const parentLog = aTimeLog({ id: 'l-p', taskId: 'parent-1' });
    const childLog = aTimeLog({ id: 'l-c', taskId: 'child-1' });
    const otherLog = aTimeLog({ id: 'l-o', taskId: 'other-1' });

    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [parent, child, other],
      logs: [parentLog, childLog, otherLog],
      activeLog: childLog,
    });

    // Act
    const result = await tasksPersistence.delete('parent-1');

    // Assert
    expect(result.tasks.map((t) => t.id)).toEqual(['other-1']);
    expect(result.logs.map((l) => l.id)).toEqual(['l-o']);
    expect(result.activeLog).toBeNull();
  });

  it('should toggle task completion and close active log if running', async () => {
    // Arrange
    const task = aTask({ id: 'task-1', completed: false, status: 'Todo' });
    const activeLog = aTimeLog({ id: 'l-active', taskId: 'task-1', endTime: null });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [task],
      logs: [activeLog],
      activeLog,
    });

    // Act
    const result = await tasksPersistence.toggleComplete('task-1');

    // Assert
    expect(result.tasks[0].completed).toBe(true);
    expect(result.tasks[0].status).toBe('Done');
    expect(result.activeLog).toBeNull();
    expect(result.logs[0].endTime).toBeDefined();
  });

  it('should return project id for existing task', async () => {
    // Arrange
    const task = aTask({ id: 'task-1', projectId: 'proj-42' });
    vi.mocked(storeMock.getStateOrDefault).mockResolvedValueOnce({
      projects: [],
      tasks: [task],
      logs: [],
      activeLog: null,
    });

    // Act
    const projectId = await tasksPersistence.getProjectId('task-1');

    // Assert
    expect(projectId).toBe('proj-42');
  });

  it('should throw exception when getProjectId is called for non-existent task', async () => {
    // Act & Assert
    await expect(tasksPersistence.getProjectId('missing')).rejects.toThrow();
  });
});

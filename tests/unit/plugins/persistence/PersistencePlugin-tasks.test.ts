import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';

vi.mock('@plugins/persistence/InitialData', () => ({
  INIT_PROJECTS: [],
  INIT_TASKS: [],
  INIT_LOGS: [],
  DEFAULT_HOLIDAYS: []
}));

describe('Unit Tests: PersistencePlugin - Tasks', () => {
  let plugin: PersistencePlugin;

  beforeEach(async () => {
    setupLocalStorageMock();
    localStorage.clear();
    plugin = new PersistencePlugin();
    await plugin.core.overrideState({ projects: [], tasks: [], logs: [], activeLog: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add a task', async () => {
    // Arrange & Act
    const state = await plugin.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });

    // Assert
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].name).toBe('Task 1');
    expect(state.tasks[0].projectId).toBe('p1');
    expect(state.tasks[0].id).toBeDefined();
    expect(state.tasks[0].completed).toBe(false);
  });

  it('should throw hierarchy error when nesting more than one level deep on add', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Level 0', parentTaskId: null });
    let state = await plugin.core.load();
    const level0Id = state!.tasks[0].id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Level 1', parentTaskId: level0Id });
    state = await plugin.core.load();
    const level1Id = state!.tasks.find(t => t.parentTaskId === level0Id)!.id;

    // Act & Assert
    await expect(plugin.tasks.add({ projectId: 'p1', name: 'Level 2', parentTaskId: level1Id }))
      .rejects.toThrow('Cannot nest tasks more than one level deep');
  });

  it('should rename a task', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Old Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    // Act
    state = await plugin.tasks.rename(taskId, 'New Task');

    // Assert
    expect(state.tasks[0].name).toBe('New Task');
  });

  it('should delete a task and cascade delete its subtasks, logs and activeLog', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Parent', parentTaskId: null });
    let state = await plugin.core.load();
    const parentId = state!.tasks[0].id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Child', parentTaskId: parentId });
    state = await plugin.core.load();
    const childId = state!.tasks.find(t => t.parentTaskId === parentId)!.id;

    await plugin.timeLogs.insert('log-parent', parentId, '2026-06-15T10:00:00Z');
    await plugin.timeLogs.insert('log-child', childId, '2026-06-15T11:00:00Z');

    state = await plugin.core.load();
    expect(state!.tasks).toHaveLength(2);
    expect(state!.logs).toHaveLength(2);
    expect(state!.activeLog).not.toBeNull();

    // Act
    state = await plugin.tasks.delete(parentId);

    // Assert
    expect(state.tasks).toHaveLength(0);
    expect(state.logs).toHaveLength(0);
    expect(state.activeLog).toBeNull();
  });

  it('should toggle task complete and set status to Done', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    expect(state!.tasks[0].completed).toBe(false);

    // Act
    state = await plugin.tasks.toggleComplete(taskId);

    // Assert
    expect(state.tasks[0].completed).toBe(true);
    expect(state.tasks[0].status).toBe('Done');
  });

  it('should toggle task complete back to false and reset status to Todo', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    await plugin.tasks.toggleComplete(taskId);

    // Act
    state = await plugin.tasks.toggleComplete(taskId);

    // Assert
    expect(state.tasks[0].completed).toBe(false);
    expect(state.tasks[0].status).toBe('Todo');
  });

  it('should set status to Done when tasks.update completed is true', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    // Act
    state = await plugin.tasks.update(taskId, 'Task', null, null, true);

    // Assert
    expect(state.tasks[0].completed).toBe(true);
    expect(state.tasks[0].status).toBe('Done');
  });

  it('should reset status to Todo when tasks.update completed is false and was Done', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    await plugin.tasks.update(taskId, 'Task', null, null, true);

    // Act
    state = await plugin.tasks.update(taskId, 'Task', null, null, false);

    // Assert
    expect(state.tasks[0].completed).toBe(false);
    expect(state.tasks[0].status).toBe('Todo');
  });

  it('should update status and mark not completed when status is InProgress', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    // Act
    state = await plugin.tasks.update(taskId, 'Task', null, 'InProgress', null);

    // Assert
    expect(state.tasks[0].status).toBe('InProgress');
    expect(state.tasks[0].completed).toBe(false);
  });

  it('should mark task as completed when status is updated to Done', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    // Act
    state = await plugin.tasks.update(taskId, 'Task', null, 'Done', null);

    // Assert
    expect(state.tasks[0].completed).toBe(true);
  });

  it('should throw hierarchy error when task is set as its own parent', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    const state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    // Act & Assert
    await expect(plugin.tasks.update(taskId, 'Task', taskId, null, null))
      .rejects.toThrow('Task cannot be its own parent');
  });

  it('should throw hierarchy error when setting parent that already has a parent', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Root', parentTaskId: null });
    let state = await plugin.core.load();
    const rootId = state!.tasks[0].id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Child', parentTaskId: rootId });
    state = await plugin.core.load();
    const childId = state!.tasks.find(t => t.parentTaskId === rootId)!.id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Orphan', parentTaskId: null });
    state = await plugin.core.load();
    const orphanId = state!.tasks.find(t => !t.parentTaskId && t.name === 'Orphan')!.id;

    // Act & Assert
    await expect(plugin.tasks.update(orphanId, 'Orphan', childId, null, null))
      .rejects.toThrow('Cannot nest tasks more than one level deep');
  });

  it('should throw when setting parent on a task that already has subtasks', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Parent', parentTaskId: null });
    let state = await plugin.core.load();
    const parentId = state!.tasks[0].id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Child', parentTaskId: parentId });

    await plugin.tasks.add({ projectId: 'p1', name: 'Other', parentTaskId: null });
    state = await plugin.core.load();
    const otherId = state!.tasks.find(t => t.name === 'Other')!.id;

    // Act & Assert
    await expect(plugin.tasks.update(parentId, 'Parent', otherId, null, null))
      .rejects.toThrow('Cannot set a parent for a task that already has subtasks');
  });

  it('should return projectId for existing task', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p99', name: 'Task', parentTaskId: null });
    const state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    // Act
    const projectId = await plugin.tasks.getProjectId(taskId);

    // Assert
    expect(projectId).toBe('p99');
  });

  it('should throw when getProjectId is called for non-existing task', async () => {
    // Arrange, Act & Assert
    await expect(plugin.tasks.getProjectId('non-existing-id'))
      .rejects.toThrow('Task non-existing-id not found');
  });

  it('should return only direct subtasks when getSubtasks is called', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Parent', parentTaskId: null });
    const state = await plugin.core.load();
    const parentId = state!.tasks[0].id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Child A', parentTaskId: parentId });
    await plugin.tasks.add({ projectId: 'p1', name: 'Child B', parentTaskId: parentId });
    await plugin.tasks.add({ projectId: 'p1', name: 'Unrelated', parentTaskId: null });

    // Act
    const subtasks = await plugin.tasks.getSubtasks(parentId);

    // Assert
    expect(subtasks).toHaveLength(2);
    expect(subtasks.every(t => t.parentTaskId === parentId)).toBe(true);
  });

  it('should return empty array when task has no children', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Alone', parentTaskId: null });
    const state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    // Act
    const subtasks = await plugin.tasks.getSubtasks(taskId);

    // Assert
    expect(subtasks).toHaveLength(0);
  });
});

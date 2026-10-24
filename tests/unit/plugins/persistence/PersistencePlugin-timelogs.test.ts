import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';
import { PersistenceException } from '@common/exceptions';

vi.mock('@plugins/persistence/InitialData', () => ({
  INIT_PROJECTS: [],
  INIT_TASKS: [],
  INIT_LOGS: [],
  DEFAULT_HOLIDAYS: []
}));

describe('Unit Tests: PersistencePlugin - TimeLogs', () => {
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

  it('should return only logs matching taskId when getForTask is called', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task A', parentTaskId: null });
    await plugin.tasks.add({ projectId: 'p1', name: 'Task B', parentTaskId: null });
    const state = await plugin.core.load();
    const taskAId = state!.tasks[0].id;
    const taskBId = state!.tasks[1].id;
    const now = new Date().toISOString();

    await plugin.timeLogs.insert('log1', taskAId, now);
    await plugin.timeLogs.insert('log2', taskBId, now);

    // Act
    const logsForA = await plugin.timeLogs.getForTask(taskAId);

    // Assert
    expect(logsForA).toHaveLength(1);
    expect(logsForA[0].taskId).toBe(taskAId);
  });

  it('should create log and set activeLog on valid insert', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    const now = new Date().toISOString();

    // Act
    await plugin.timeLogs.insert('log-xyz', taskId, now);

    // Assert
    state = await plugin.core.load();
    expect(state!.logs).toHaveLength(1);
    expect(state!.logs[0].id).toBe('log-xyz');
    expect(state!.logs[0].taskId).toBe(taskId);
    expect(state!.logs[0].endTime).toBeUndefined();
    expect(state!.activeLog).not.toBeNull();
    expect(state!.activeLog!.id).toBe('log-xyz');
  });

  it('should throw when insert is called with non-existing task', async () => {
    // Arrange, Act & Assert
    await expect(plugin.timeLogs.insert('log1', 'bad-task-id', new Date().toISOString()))
      .rejects.toThrow('Task bad-task-id not found');
  });

  it('should close only project-specific active logs on closeActiveByProject', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task P1', parentTaskId: null });
    await plugin.tasks.add({ projectId: 'p2', name: 'Task P2', parentTaskId: null });
    let state = await plugin.core.load();
    const taskP1Id = state!.tasks.find(t => t.projectId === 'p1')!.id;
    const taskP2Id = state!.tasks.find(t => t.projectId === 'p2')!.id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log-p1', taskP1Id, start);
    await plugin.timeLogs.insert('log-p2', taskP2Id, start);

    // Act
    const endTime = new Date().toISOString();
    await plugin.timeLogs.closeActiveByProject(endTime, 'p1');

    // Assert
    state = await plugin.core.load();
    const logP1 = state!.logs.find(l => l.id === 'log-p1');
    const logP2 = state!.logs.find(l => l.id === 'log-p2');
    expect(logP1!.endTime).toBe(endTime);
    expect(logP2!.endTime).toBeUndefined();
  });

  it('should leave state unchanged when closeActiveByProject called on already-closed logs', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log1', taskId, start);
    const firstClose = '2026-01-01T10:00:00.000Z';
    await plugin.timeLogs.closeActiveByProject(firstClose, 'p1');

    // Act
    const secondClose = '2026-01-01T11:00:00.000Z';
    await plugin.timeLogs.closeActiveByProject(secondClose, 'p1');

    // Assert
    state = await plugin.core.load();
    expect(state!.logs[0].endTime).toBe(firstClose);
  });

  it('should close all active logs on closeAllActive', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task A', parentTaskId: null });
    await plugin.tasks.add({ projectId: 'p1', name: 'Task B', parentTaskId: null });
    let state = await plugin.core.load();
    const taskAId = state!.tasks[0].id;
    const taskBId = state!.tasks[1].id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log-a', taskAId, start);
    await plugin.timeLogs.insert('log-b', taskBId, start);

    // Act
    const endTime = new Date().toISOString();
    await plugin.timeLogs.closeAllActive(endTime);

    // Assert
    state = await plugin.core.load();
    expect(state!.logs.every(l => l.endTime !== undefined)).toBe(true);
    expect(state!.activeLog).toBeNull();
  });

  it('should retain initial endTime when closeAllActive is called multiple times', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log1', taskId, start);
    const firstClose = '2026-01-01T10:00:00.000Z';
    await plugin.timeLogs.closeAllActive(firstClose);

    // Act
    const secondClose = '2026-01-01T11:00:00.000Z';
    await plugin.timeLogs.closeAllActive(secondClose);

    // Assert
    state = await plugin.core.load();
    expect(state!.logs[0].endTime).toBe(firstClose);
  });

  it('should return active task IDs on queryActive', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task A', parentTaskId: null });
    await plugin.tasks.add({ projectId: 'p1', name: 'Task B', parentTaskId: null });
    const state = await plugin.core.load();
    const taskAId = state!.tasks[0].id;
    const taskBId = state!.tasks[1].id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log-a', taskAId, start);
    await plugin.timeLogs.insert('log-b', taskBId, start);
    await plugin.timeLogs.closeActiveByProject(new Date().toISOString(), 'p1');

    // Act
    const active = await plugin.timeLogs.queryActive();

    // Assert
    expect(active).not.toContain(taskAId);
  });

  it('should return all logs on getAll', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    const state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log-1', taskId, start);
    await plugin.timeLogs.insert('log-2', taskId, start);

    // Act
    const all = await plugin.timeLogs.getAll();

    // Assert
    expect(all).toHaveLength(2);
  });

  it('should delete existing time log and clear activeLog when delete is called', async () => {
    // Arrange
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    const state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    const start = new Date().toISOString();
    await plugin.timeLogs.insert('log-to-delete', taskId, start);

    // Act
    await plugin.timeLogs.delete('log-to-delete');

    // Assert
    const afterDelete = await plugin.core.load();
    expect(afterDelete!.logs).toHaveLength(0);
    expect(afterDelete!.activeLog).toBeNull();
  });

  it('should throw PersistenceException when delete is called on non-existent time log', async () => {
    // Arrange
    const nonExistentLogId = 'log-404';

    // Act
    const action = () => plugin.timeLogs.delete(nonExistentLogId);

    // Assert
    await expect(action).rejects.toThrow(PersistenceException);
  });
});

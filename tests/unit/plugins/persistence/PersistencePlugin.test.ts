import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';
import { RuntimeConfig } from '@bindings/RuntimeConfig';

vi.mock('@plugins/persistence/InitialData', () => ({
  INIT_PROJECTS: [],
  INIT_TASKS: [],
  INIT_LOGS: [],
  DEFAULT_HOLIDAYS: []
}));

const STORAGE_KEY = 'timelog_persistence_plugin_state';
const SETTINGS_KEY = 'timelog_persistence_plugin_settings';
const RUN_CONFIGS_KEY = 'timelog_persistence_plugin_runtime_configs';

describe('Unit Tests: PersistencePlugin', () => {
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

  // --- core ---

  it('should return default state when localstorage is empty', async () => {
    const state = await plugin.core.load();
    expect(state).toEqual({ projects: [], tasks: [], logs: [], activeLog: null });
  });

  it('should load state from localstorage', async () => {
    const mockState = { projects: [{ id: 'p1', name: 'Project 1', color: '#000', createdAt: 'date' }], tasks: [], logs: [], activeLog: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));

    const state = await plugin.core.load();
    expect(state).toEqual(mockState);
  });

  it('should handle JSON parse error gracefully', async () => {
    localStorage.setItem(STORAGE_KEY, 'invalid json');
    const state = await plugin.core.load();
    expect(state).toEqual({ projects: [], tasks: [], logs: [], activeLog: null });
  });

  it('should override state', async () => {
    const newState = { projects: [{ id: 'p1', name: 'P1', color: '#000', createdAt: 'date' }] };
    const state = await plugin.core.overrideState(newState as Parameters<typeof plugin.core.overrideState>[0]);
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].name).toBe('P1');
  });

  it('should reset state and clear all keys', async () => {
    await plugin.projects.add({ name: 'Project', color: '#000' });
    await plugin.settings.save({ autoStart: true, autoPauseOnSleep: false, includePatchesInReports: false, activeSinks: [] });
    const state = await plugin.core.reset();
    expect(state.projects).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(SETTINGS_KEY)).toBeNull();
    expect(localStorage.getItem(RUN_CONFIGS_KEY)).toBeNull();
  });

  // --- projects ---

  it('should add a project', async () => {
    const state = await plugin.projects.add({ name: 'New Project', color: '#FFF' });
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].name).toBe('New Project');
    expect(state.projects[0].color).toBe('#FFF');
    expect(state.projects[0].id).toBeDefined();

    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(storedData.projects).toHaveLength(1);
  });

  it('should toggle project archive', async () => {
    await plugin.projects.add({ name: 'Project 1', color: '#000' });
    let state = await plugin.core.load();
    const projectId = state!.projects[0].id;

    expect(state!.projects[0].archived).toBe(false);

    state = await plugin.projects.toggleArchive(projectId);
    expect(state.projects[0].archived).toBe(true);
  });

  it('should rename a project', async () => {
    await plugin.projects.add({ name: 'Old', color: '#000' });
    let state = await plugin.core.load();
    const projectId = state!.projects[0].id;

    state = await plugin.projects.rename(projectId, 'New');
    expect(state.projects[0].name).toBe('New');
  });

  it('should update a project with all fields', async () => {
    await plugin.projects.add({ name: 'Original', color: 'red' });
    let state = await plugin.core.load();
    const projectId = state!.projects[0].id;

    state = await plugin.projects.update(projectId, 'Updated', 'blue', 'A description', '🚀', ['tag1']);
    expect(state.projects[0].name).toBe('Updated');
    expect(state.projects[0].color).toBe('blue');
    expect(state.projects[0].description).toBe('A description');
    expect(state.projects[0].icon).toBe('🚀');
    expect(state.projects[0].tags).toEqual(['tag1']);
  });

  it('should update a project and clear optional fields when null is passed', async () => {
    await plugin.projects.add({ name: 'Original', color: 'red', description: 'desc', icon: '🔥', tags: ['t'] });
    let state = await plugin.core.load();
    const projectId = state!.projects[0].id;

    state = await plugin.projects.update(projectId, 'Updated', 'blue', null, null, null);
    expect(state.projects[0].description).toBeUndefined();
    expect(state.projects[0].icon).toBeUndefined();
    expect(state.projects[0].tags).toBeUndefined();
  });

  // --- tasks ---

  it('should add a task', async () => {
    const state = await plugin.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].name).toBe('Task 1');
    expect(state.tasks[0].projectId).toBe('p1');
    expect(state.tasks[0].id).toBeDefined();
    expect(state.tasks[0].completed).toBe(false);
  });

  it('Given parentTask has a parentTaskId, When adding subtask to it, Then it should throw hierarchy error', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Level 0', parentTaskId: null });
    let state = await plugin.core.load();
    const level0Id = state!.tasks[0].id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Level 1', parentTaskId: level0Id });
    state = await plugin.core.load();
    const level1Id = state!.tasks.find(t => t.parentTaskId === level0Id)!.id;

    await expect(plugin.tasks.add({ projectId: 'p1', name: 'Level 2', parentTaskId: level1Id }))
      .rejects.toThrow('Cannot nest tasks more than one level deep');
  });

  it('should rename a task', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Old Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    state = await plugin.tasks.rename(taskId, 'New Task');
    expect(state.tasks[0].name).toBe('New Task');
  });

  it('should delete a task', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    state = await plugin.tasks.delete(taskId);
    expect(state.tasks).toHaveLength(0);
  });

  it('should toggle task complete and set status to Done', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    expect(state!.tasks[0].completed).toBe(false);

    state = await plugin.tasks.toggleComplete(taskId);
    expect(state.tasks[0].completed).toBe(true);
    expect(state.tasks[0].status).toBe('Done');
  });

  it('should toggle task complete back to false and reset status to Todo', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    await plugin.tasks.toggleComplete(taskId);
    state = await plugin.tasks.toggleComplete(taskId);
    expect(state.tasks[0].completed).toBe(false);
    expect(state.tasks[0].status).toBe('Todo');
  });

  it('Given tasks.update with completed=true, Then it should set status to Done', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    state = await plugin.tasks.update(taskId, 'Task', null, null, true);
    expect(state.tasks[0].completed).toBe(true);
    expect(state.tasks[0].status).toBe('Done');
  });

  it('Given tasks.update with completed=false and status was Done, Then it should reset status to Todo', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    await plugin.tasks.update(taskId, 'Task', null, null, true);

    state = await plugin.tasks.update(taskId, 'Task', null, null, false);
    expect(state.tasks[0].completed).toBe(false);
    expect(state.tasks[0].status).toBe('Todo');
  });

  it('Given tasks.update with status=InProgress, Then it should update status and mark not completed', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    state = await plugin.tasks.update(taskId, 'Task', null, 'InProgress', null);
    expect(state.tasks[0].status).toBe('InProgress');
    expect(state.tasks[0].completed).toBe(false);
  });

  it('Given tasks.update with status=Done, Then it should mark task as completed', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    state = await plugin.tasks.update(taskId, 'Task', null, 'Done', null);
    expect(state.tasks[0].completed).toBe(true);
  });

  it('Given tasks.update sets task as its own parent, Then it should throw hierarchy error', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    const state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    await expect(plugin.tasks.update(taskId, 'Task', taskId, null, null))
      .rejects.toThrow('Task cannot be its own parent');
  });

  it('Given tasks.update sets parent with its own parentTaskId, Then it should throw hierarchy error', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Root', parentTaskId: null });
    let state = await plugin.core.load();
    const rootId = state!.tasks[0].id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Child', parentTaskId: rootId });
    state = await plugin.core.load();
    const childId = state!.tasks.find(t => t.parentTaskId === rootId)!.id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Orphan', parentTaskId: null });
    state = await plugin.core.load();
    const orphanId = state!.tasks.find(t => !t.parentTaskId && t.name === 'Orphan')!.id;

    await expect(plugin.tasks.update(orphanId, 'Orphan', childId, null, null))
      .rejects.toThrow('Cannot nest tasks more than one level deep');
  });

  it('Given tasks.update sets parentTaskId for task that already has subtasks, Then it should throw', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Parent', parentTaskId: null });
    let state = await plugin.core.load();
    const parentId = state!.tasks[0].id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Child', parentTaskId: parentId });

    await plugin.tasks.add({ projectId: 'p1', name: 'Other', parentTaskId: null });
    state = await plugin.core.load();
    const otherId = state!.tasks.find(t => t.name === 'Other')!.id;

    await expect(plugin.tasks.update(parentId, 'Parent', otherId, null, null))
      .rejects.toThrow('Cannot set a parent for a task that already has subtasks');
  });

  it('Given tasks.getProjectId for existing task, Then it should return its projectId', async () => {
    await plugin.tasks.add({ projectId: 'p99', name: 'Task', parentTaskId: null });
    const state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    const projectId = await plugin.tasks.getProjectId(taskId);
    expect(projectId).toBe('p99');
  });

  it('Given tasks.getProjectId for non-existing task, Then it should throw', async () => {
    await expect(plugin.tasks.getProjectId('non-existing-id'))
      .rejects.toThrow('Task non-existing-id not found');
  });

  it('Given tasks.getSubtasks, Then it should return only direct subtasks', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Parent', parentTaskId: null });
    const state = await plugin.core.load();
    const parentId = state!.tasks[0].id;

    await plugin.tasks.add({ projectId: 'p1', name: 'Child A', parentTaskId: parentId });
    await plugin.tasks.add({ projectId: 'p1', name: 'Child B', parentTaskId: parentId });
    await plugin.tasks.add({ projectId: 'p1', name: 'Unrelated', parentTaskId: null });

    const subtasks = await plugin.tasks.getSubtasks(parentId);
    expect(subtasks).toHaveLength(2);
    expect(subtasks.every(t => t.parentTaskId === parentId)).toBe(true);
  });

  it('Given tasks.getSubtasks for task with no children, Then it should return empty array', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Alone', parentTaskId: null });
    const state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    const subtasks = await plugin.tasks.getSubtasks(taskId);
    expect(subtasks).toHaveLength(0);
  });

  // --- settings ---

  it('Given settings.get with no stored data, Then it should return default settings', async () => {
    const settings = await plugin.settings.get();
    expect(settings.autoStart).toBe(false);
    expect(settings.autoPauseOnSleep).toBe(true);
    expect(settings.includePatchesInReports).toBe(true);
    expect(settings.theme).toBe('system');
    expect(settings.textAndIconSize).toBe('medium');
  });

  it('Given settings.get with partial data stored, Then it should merge with defaults', async () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ autoStart: true }));
    const settings = await plugin.settings.get();
    expect(settings.autoStart).toBe(true);
    expect(settings.autoPauseOnSleep).toBe(true);
  });

  it('Given settings.get with invalid JSON, Then it should return defaults', async () => {
    localStorage.setItem(SETTINGS_KEY, 'bad-json');
    const settings = await plugin.settings.get();
    expect(settings.autoStart).toBe(false);
  });

  it('Given settings.save, Then it should persist settings to localStorage', async () => {
    const newSettings = { autoStart: true, autoPauseOnSleep: false, includePatchesInReports: false, activeSinks: [] as string[] };
    await plugin.settings.save(newSettings as Parameters<typeof plugin.settings.save>[0]);
    const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
    expect(stored.autoStart).toBe(true);
    expect(stored.autoPauseOnSleep).toBe(false);
  });

  // --- runtimeConfigs ---

  it('Given runtimeConfigs.getAll with no stored data, Then it should return empty array', async () => {
    const configs = await plugin.runtimeConfigs.getAll();
    expect(configs).toEqual([]);
  });

  it('Given runtimeConfigs.save new config, Then it should persist it', async () => {
    const cfg: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: '{}', createdAt: '2026-01-01T00:00:00Z' };
    await plugin.runtimeConfigs.save(cfg);
    const configs = await plugin.runtimeConfigs.getAll();
    expect(configs).toHaveLength(1);
    expect(configs[0].id).toBe('cfg1');
  });

  it('Given runtimeConfigs.save existing config by id, Then it should update it in place', async () => {
    const original: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: '{"v":1}', createdAt: '2026-01-01T00:00:00Z' };
    await plugin.runtimeConfigs.save(original);
    const updated: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: '{"v":2}', createdAt: '2026-01-01T00:00:00Z' };
    await plugin.runtimeConfigs.save(updated);
    const configs = await plugin.runtimeConfigs.getAll();
    expect(configs).toHaveLength(1);
    expect(configs[0].config).toBe('{"v":2}');
  });

  it('Given runtimeConfigs.save multiple configs, Then it should keep all', async () => {
    const cfg1: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: '{}', createdAt: '2026-01-01T00:00:00Z' };
    const cfg2: RuntimeConfig = { id: 'cfg2', runtime: 'tauri', config: '{}', createdAt: '2026-01-01T00:00:00Z' };
    await plugin.runtimeConfigs.save(cfg1);
    await plugin.runtimeConfigs.save(cfg2);
    const configs = await plugin.runtimeConfigs.getAll();
    expect(configs).toHaveLength(2);
  });

  // --- timeLogs ---

  it('Given timeLogs.getForTask, Then it should return only logs matching taskId', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task A', parentTaskId: null });
    await plugin.tasks.add({ projectId: 'p1', name: 'Task B', parentTaskId: null });
    const state = await plugin.core.load();
    const taskAId = state!.tasks[0].id;
    const taskBId = state!.tasks[1].id;
    const now = new Date().toISOString();

    await plugin.timeLogs.insert('log1', taskAId, now);
    await plugin.timeLogs.insert('log2', taskBId, now);

    const logsForA = await plugin.timeLogs.getForTask(taskAId);
    expect(logsForA).toHaveLength(1);
    expect(logsForA[0].taskId).toBe(taskAId);
  });

  it('Given timeLogs.insert with valid task, Then it should create log and set activeLog', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    const now = new Date().toISOString();

    await plugin.timeLogs.insert('log-xyz', taskId, now);

    state = await plugin.core.load();
    expect(state!.logs).toHaveLength(1);
    expect(state!.logs[0].id).toBe('log-xyz');
    expect(state!.logs[0].taskId).toBe(taskId);
    expect(state!.logs[0].endTime).toBeUndefined();
    expect(state!.activeLog).not.toBeNull();
    expect(state!.activeLog!.id).toBe('log-xyz');
  });

  it('Given timeLogs.insert with non-existing task, Then it should throw', async () => {
    await expect(plugin.timeLogs.insert('log1', 'bad-task-id', new Date().toISOString()))
      .rejects.toThrow('Task bad-task-id not found');
  });

  it('Given timeLogs.closeActiveByProject, Then it should close only project-specific active logs', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task P1', parentTaskId: null });
    await plugin.tasks.add({ projectId: 'p2', name: 'Task P2', parentTaskId: null });
    let state = await plugin.core.load();
    const taskP1Id = state!.tasks.find(t => t.projectId === 'p1')!.id;
    const taskP2Id = state!.tasks.find(t => t.projectId === 'p2')!.id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log-p1', taskP1Id, start);
    await plugin.timeLogs.insert('log-p2', taskP2Id, start);

    const endTime = new Date().toISOString();
    await plugin.timeLogs.closeActiveByProject(endTime, 'p1');

    state = await plugin.core.load();
    const logP1 = state!.logs.find(l => l.id === 'log-p1');
    const logP2 = state!.logs.find(l => l.id === 'log-p2');
    expect(logP1!.endTime).toBe(endTime);
    expect(logP2!.endTime).toBeUndefined();
  });

  it('Given timeLogs.closeActiveByProject with already-closed logs, Then state should remain unchanged', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log1', taskId, start);
    const firstClose = '2026-01-01T10:00:00.000Z';
    await plugin.timeLogs.closeActiveByProject(firstClose, 'p1');

    const secondClose = '2026-01-01T11:00:00.000Z';
    await plugin.timeLogs.closeActiveByProject(secondClose, 'p1');

    state = await plugin.core.load();
    expect(state!.logs[0].endTime).toBe(firstClose);
  });

  it('Given timeLogs.closeAllActive, Then it should close all active logs', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task A', parentTaskId: null });
    await plugin.tasks.add({ projectId: 'p1', name: 'Task B', parentTaskId: null });
    let state = await plugin.core.load();
    const taskAId = state!.tasks[0].id;
    const taskBId = state!.tasks[1].id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log-a', taskAId, start);
    await plugin.timeLogs.insert('log-b', taskBId, start);

    const endTime = new Date().toISOString();
    await plugin.timeLogs.closeAllActive(endTime);

    state = await plugin.core.load();
    expect(state!.logs.every(l => l.endTime !== undefined)).toBe(true);
    expect(state!.activeLog).toBeNull();
  });

  it('Given timeLogs.closeAllActive with already-closed logs, Then endTime should remain from first close', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    let state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log1', taskId, start);
    const firstClose = '2026-01-01T10:00:00.000Z';
    await plugin.timeLogs.closeAllActive(firstClose);

    const secondClose = '2026-01-01T11:00:00.000Z';
    await plugin.timeLogs.closeAllActive(secondClose);

    state = await plugin.core.load();
    expect(state!.logs[0].endTime).toBe(firstClose);
  });

  it('Given timeLogs.queryActive, Then it should return taskIds of active logs', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task A', parentTaskId: null });
    await plugin.tasks.add({ projectId: 'p1', name: 'Task B', parentTaskId: null });
    const state = await plugin.core.load();
    const taskAId = state!.tasks[0].id;
    const taskBId = state!.tasks[1].id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log-a', taskAId, start);
    await plugin.timeLogs.insert('log-b', taskBId, start);
    await plugin.timeLogs.closeActiveByProject(new Date().toISOString(), 'p1');

    const active = await plugin.timeLogs.queryActive();
    expect(active).not.toContain(taskAId);
  });

  it('Given timeLogs.getAll, Then it should return all logs', async () => {
    await plugin.tasks.add({ projectId: 'p1', name: 'Task', parentTaskId: null });
    const state = await plugin.core.load();
    const taskId = state!.tasks[0].id;
    const start = new Date().toISOString();

    await plugin.timeLogs.insert('log-1', taskId, start);
    await plugin.timeLogs.insert('log-2', taskId, start);

    const all = await plugin.timeLogs.getAll();
    expect(all).toHaveLength(2);
  });
});

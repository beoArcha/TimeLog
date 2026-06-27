import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { setupLocalStorageMock } from '../../../shared/test-helpers';

const STORAGE_KEY = 'timelog_persistence_plugin_state';

describe('Unit Tests: PersistencePlugin', () => {
  let plugin: PersistencePlugin;

  beforeEach(() => {
    setupLocalStorageMock();
    plugin = new PersistencePlugin();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return default state when localstorage is empty', async () => {
    const state = await plugin.load();
    expect(state).toEqual({ projects: [], tasks: [], logs: [], activeLog: null });
  });

  it('should load state from localstorage', async () => {
    const mockState = { projects: [{ id: 'p1', name: 'Project 1', color: '#000', createdAt: 'date' }], tasks: [], logs: [], activeLog: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));
    
    const state = await plugin.load();
    expect(state).toEqual(mockState);
  });

  it('should handle JSON parse error gracefully', async () => {
    localStorage.setItem(STORAGE_KEY, 'invalid json');
    const state = await plugin.load();
    expect(state).toEqual({ projects: [], tasks: [], logs: [], activeLog: null });
  });

  it('should add a project', async () => {
    const state = await plugin.addProject({ name: 'New Project', color: '#FFF' });
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].name).toBe('New Project');
    expect(state.projects[0].color).toBe('#FFF');
    expect(state.projects[0].id).toBeDefined();

    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(storedData.projects).toHaveLength(1);
  });

  it('should toggle project archive', async () => {
    await plugin.addProject({ name: 'Project 1', color: '#000' });
    let state = await plugin.load();
    const projectId = state!.projects[0].id;
    
    expect(state!.projects[0].archived).toBe(false);

    state = await plugin.toggleProjectArchive(projectId);
    expect(state.projects[0].archived).toBe(true);
  });

  it('should add a task', async () => {
    const state = await plugin.addTask({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    expect(state.tasks).toHaveLength(1);
    expect(state.tasks[0].name).toBe('Task 1');
    expect(state.tasks[0].projectId).toBe('p1');
    expect(state.tasks[0].id).toBeDefined();
    expect(state.tasks[0].completed).toBe(false);
  });

  it('should rename a project', async () => {
    await plugin.addProject({ name: 'Old', color: '#000' });
    let state = await plugin.load();
    const projectId = state!.projects[0].id;

    state = await plugin.renameProject(projectId, 'New');
    expect(state.projects[0].name).toBe('New');
  });

  it('should rename a task', async () => {
    await plugin.addTask({ projectId: 'p1', name: 'Old Task', parentTaskId: null });
    let state = await plugin.load();
    const taskId = state!.tasks[0].id;

    state = await plugin.renameTask(taskId, 'New Task');
    expect(state.tasks[0].name).toBe('New Task');
  });

  it('should delete a task', async () => {
    await plugin.addTask({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    let state = await plugin.load();
    const taskId = state!.tasks[0].id;

    state = await plugin.deleteTask(taskId);
    expect(state.tasks).toHaveLength(0);
  });

  it('should toggle task complete', async () => {
    await plugin.addTask({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
    let state = await plugin.load();
    const taskId = state!.tasks[0].id;

    expect(state!.tasks[0].completed).toBe(false);

    state = await plugin.toggleTaskComplete(taskId);
    expect(state.tasks[0].completed).toBe(true);
  });

  it('should override state', async () => {
    const newState = { projects: [{ id: 'p1', name: 'P1', color: '#000', createdAt: 'date' }] };
    const state = await plugin.overrideState(newState as any);
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].name).toBe('P1');
  });

  it('should reset state', async () => {
    await plugin.addProject({ name: 'Project', color: '#000' });
    let state = await plugin.reset();
    expect(state.projects).toHaveLength(0);
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';

vi.mock('@plugins/persistence/InitialData', () => ({
  INIT_PROJECTS: [],
  INIT_TASKS: [],
  INIT_LOGS: [],
  DEFAULT_HOLIDAYS: []
}));

const STORAGE_KEY = 'timelog_persistence_plugin_state';

describe('Unit Tests: PersistencePlugin - Projects', () => {
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

  it('should add a project', async () => {
    // Arrange & Act
    const state = await plugin.projects.add({ name: 'New Project', color: '#FFF' });

    // Assert
    expect(state.projects).toHaveLength(1);
    expect(state.projects[0].name).toBe('New Project');
    expect(state.projects[0].color).toBe('#FFF');
    expect(state.projects[0].id).toBeDefined();

    const storedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    expect(storedData.projects).toHaveLength(1);
  });

  it('should toggle project archive', async () => {
    // Arrange
    await plugin.projects.add({ name: 'Project 1', color: '#000' });
    let state = await plugin.core.load();
    const projectId = state!.projects[0].id;
    expect(state!.projects[0].archived).toBe(false);

    // Act
    state = await plugin.projects.toggleArchive(projectId);

    // Assert
    expect(state.projects[0].archived).toBe(true);
  });

  it('should rename a project', async () => {
    // Arrange
    await plugin.projects.add({ name: 'Old', color: '#000' });
    let state = await plugin.core.load();
    const projectId = state!.projects[0].id;

    // Act
    state = await plugin.projects.rename(projectId, 'New');

    // Assert
    expect(state.projects[0].name).toBe('New');
  });

  it('should update a project with all fields', async () => {
    // Arrange
    await plugin.projects.add({ name: 'Original', color: 'red' });
    let state = await plugin.core.load();
    const projectId = state!.projects[0].id;

    // Act
    state = await plugin.projects.update(projectId, 'Updated', 'blue', 'A description', '🚀', ['tag1']);

    // Assert
    expect(state.projects[0].name).toBe('Updated');
    expect(state.projects[0].color).toBe('blue');
    expect(state.projects[0].description).toBe('A description');
    expect(state.projects[0].icon).toBe('🚀');
    expect(state.projects[0].tags).toEqual(['tag1']);
  });

  it('should update a project and clear optional fields when null is passed', async () => {
    // Arrange
    await plugin.projects.add({ name: 'Original', color: 'red', description: 'desc', icon: '🔥', tags: ['t'] });
    let state = await plugin.core.load();
    const projectId = state!.projects[0].id;

    // Act
    state = await plugin.projects.update(projectId, 'Updated', 'blue', null, null, null);

    // Assert
    expect(state.projects[0].description).toBeUndefined();
    expect(state.projects[0].icon).toBeUndefined();
    expect(state.projects[0].tags).toBeUndefined();
  });

  it('should close active log when archiving a project', async () => {
    // Arrange
    await plugin.projects.add({ name: 'Active Proj', color: '#ff0000' });
    let state = await plugin.core.load();
    const projId = state!.projects[0].id;

    await plugin.tasks.add({ projectId: projId, name: 'Task In Proj', parentTaskId: null });
    state = await plugin.core.load();
    const taskId = state!.tasks[0].id;

    await plugin.timeLogs.insert('log-active', taskId, '2026-06-15T10:00:00Z');
    state = await plugin.core.load();
    expect(state!.activeLog).not.toBeNull();

    // Act
    state = await plugin.projects.toggleArchive(projId);

    // Assert
    expect(state.projects[0].archived).toBe(true);
    expect(state.activeLog).toBeNull();
    expect(state.logs[0].endTime).toBeDefined();
  });
});

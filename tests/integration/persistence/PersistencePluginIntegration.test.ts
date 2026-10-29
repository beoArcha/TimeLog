// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { setupLocalStorageMock } from '@tests/shared/mocks/browser-mocks';
import { PersistenceException, ErrorHandler } from '@common/exceptions';
import { RuntimeConfig } from '@bindings/RuntimeConfig';
import { Settings } from '@bindings/Settings';

describe('Given PersistenceRouter wired to PersistencePlugin (LocalStorage)', () => {
  let _store: Record<string, string>;

  beforeEach(async () => {
    vi.restoreAllMocks();
    _store = setupLocalStorageMock();

    PersistenceRouter.getInstance().setImplementationForTesting(new PersistencePlugin());
    await PersistenceRouter.getInstance().core.overrideState({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('When state is loaded from empty LocalStorage', () => {
    it('Then it should return seeded initial repository state', async () => {
      // Given
      localStorage.clear();
      const router = PersistenceRouter.getInstance();

      // When
      const state = await router.core.load();

      // Then
      expect(state).toEqual({
        projects: [],
        tasks: [],
        logs: [],
        activeLog: null,
      });
    });
  });

  describe('When state is loaded from corrupted JSON in LocalStorage', () => {
    it('Then it should reject with PersistenceException to protect from data loss', async () => {
      // Given
      localStorage.setItem('timelog_persistence_plugin_state', 'invalid-json{');
      const router = PersistenceRouter.getInstance();

      // When
      const loadPromise = router.core.load();

      // Then
      await expect(loadPromise).rejects.toThrow();
    });
  });

  describe('When overriding core state', () => {
    it('Then it should merge partial state and persist changes', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const initial = await router.projects.add({ name: 'Project 1', color: 'blue' });
      const projId = initial.projects[0].id;

      // When
      const overridden = await router.core.overrideState({ activeLog: null });

      // Then
      expect(overridden.projects[0].id).toBe(projId);
      expect(overridden.activeLog).toBeNull();
    });
  });

  describe('When reset is triggered on existing storage', () => {
    it('Then it should clear storage and return default empty state', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      await router.projects.add({ name: 'Project to Clear', color: 'red' });
      await router.settings.save({ autoStart: true, includePatchesInReports: false, activeSinks: [] });

      // When
      const resetState = await router.core.reset();

      // Then
      expect(resetState.projects).toHaveLength(0);
      expect(localStorage.getItem('timelog_persistence_plugin_state')).toBeNull();
      expect(localStorage.getItem('timelog_persistence_plugin_settings')).toBeNull();
    });
  });

  describe('When adding a new project with valid details', () => {
    it('Then it should generate UUID and append project to repository list', async () => {
      // Given
      const router = PersistenceRouter.getInstance();

      // When
      const state = await router.projects.add({
        name: 'Alpha Project',
        color: '#ffaa00',
        description: 'Testing desc',
        tags: ['test', 'dev'],
      });

      // Then
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].id).toBeDefined();
      expect(state.projects[0].name).toBe('Alpha Project');
      expect(state.projects[0].color).toBe('#ffaa00');
      expect(state.projects[0].description).toBe('Testing desc');
      expect(state.projects[0].tags).toEqual(['test', 'dev']);
    });
  });

  describe('When toggling project archive status', () => {
    it('Then it should invert the archived boolean property', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const state1 = await router.projects.add({ name: 'Toggle Me', color: 'red' });
      const id = state1.projects[0].id;
      expect(state1.projects[0].archived).toBe(false);

      // When
      const state2 = await router.projects.toggleArchive(id);

      // Then
      expect(state2.projects[0].archived).toBe(true);

      // When
      const state3 = await router.projects.toggleArchive(id);

      // Then
      expect(state3.projects[0].archived).toBe(false);
    });
  });

  describe('When updating an existing project', () => {
    it('Then it should modify all specified fields accordingly', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const state1 = await router.projects.add({ name: 'Old Name', color: 'red' });
      const id = state1.projects[0].id;

      // When
      const state2 = await router.projects.update(id, 'New Name', 'green', 'Updated Desc', 'updated-icon', ['tag']);
      const proj = state2.projects[0];

      // Then
      expect(proj.name).toBe('New Name');
      expect(proj.color).toBe('green');
      expect(proj.description).toBe('Updated Desc');
      expect(proj.icon).toBe('updated-icon');
      expect(proj.tags).toEqual(['tag']);
    });
  });

  describe('When renaming an existing project', () => {
    it('Then it should only modify the project name without touching other properties', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const state1 = await router.projects.add({ name: 'Original', color: 'blue' });
      const id = state1.projects[0].id;

      // When
      const state2 = await router.projects.rename(id, 'Renamed');

      // Then
      expect(state2.projects[0].name).toBe('Renamed');
      expect(state2.projects[0].color).toBe('blue');
    });
  });

  describe('When creating a root task', () => {
    it('Then it should initialize task with Todo status and empty parent', async () => {
      // Given
      const router = PersistenceRouter.getInstance();

      // When
      const state = await router.tasks.add({ projectId: 'p1', name: 'Root Task', parentTaskId: null });

      // Then
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].name).toBe('Root Task');
      expect(state.tasks[0].parentTaskId).toBeUndefined();
      expect(state.tasks[0].status).toBe('Todo');
    });
  });

  describe('When querying subtasks of a parent task', () => {
    it('Then it should return all child tasks belonging to the specified parent', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const state1 = await router.tasks.add({ projectId: 'p1', name: 'Root Parent', parentTaskId: null });
      const parentId = state1.tasks[0].id;

      // When
      const state2 = await router.tasks.add({ projectId: 'p1', name: 'Child Task', parentTaskId: parentId });
      const children = await router.tasks.getSubtasks(parentId);

      // Then
      expect(state2.tasks).toHaveLength(2);
      expect(state2.tasks[1].parentTaskId).toBe(parentId);
      expect(children).toHaveLength(1);
      expect(children[0].name).toBe('Child Task');
    });
  });

  describe('When attempting illegal task nesting deeper than one level', () => {
    it('Then it should reject with ERR_PERSISTENCE_HIERARCHY exception', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const state1 = await router.tasks.add({ projectId: 'p1', name: 'Level 0', parentTaskId: null });
      const id0 = state1.tasks[0].id;
      const state2 = await router.tasks.add({ projectId: 'p1', name: 'Level 1', parentTaskId: id0 });
      const id1 = state2.tasks[1].id;

      // When & Then
      await expect(
        router.tasks.add({ projectId: 'p1', name: 'Level 2 (Illegal)', parentTaskId: id1 })
      ).rejects.toThrow(new PersistenceException('Cannot nest tasks more than one level deep', undefined, 'ERR_PERSISTENCE_HIERARCHY'));
    });
  });

  describe('When attempting to set a task parent to itself', () => {
    it('Then it should reject with ERR_PERSISTENCE_HIERARCHY exception', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const state = await router.tasks.add({ projectId: 'p1', name: 'Selfish Task', parentTaskId: null });
      const id = state.tasks[0].id;

      // When & Then
      await expect(
        router.tasks.update(id, 'Selfish Task', id, null, null)
      ).rejects.toThrow(new PersistenceException('Task cannot be its own parent', undefined, 'ERR_PERSISTENCE_HIERARCHY'));
    });
  });

  describe('When completing or toggling task completion', () => {
    it('Then it should transition task status between Todo and Done', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const state1 = await router.tasks.add({ projectId: 'p1', name: 'Complete Me', parentTaskId: null });
      const id = state1.tasks[0].id;

      // When
      const state2 = await router.tasks.toggleComplete(id);

      // Then
      expect(state2.tasks[0].completed).toBe(true);
      expect(state2.tasks[0].status).toBe('Done');

      // When
      const state3 = await router.tasks.toggleComplete(id);

      // Then
      expect(state3.tasks[0].completed).toBe(false);
      expect(state3.tasks[0].status).toBe('Todo');

      // When
      const state4 = await router.tasks.update(id, 'Complete Me', null, 'Done', null);

      // Then
      expect(state4.tasks[0].completed).toBe(true);
    });
  });

  describe('When fetching project ID for nonexistent task', () => {
    it('Then it should reject with ERR_PERSISTENCE_TASK_NOT_FOUND exception', async () => {
      // Given
      const router = PersistenceRouter.getInstance();

      // When & Then
      await expect(
        router.tasks.getProjectId('nonexistent-id')
      ).rejects.toThrow(new PersistenceException('Task nonexistent-id not found', undefined, 'ERR_PERSISTENCE_TASK_NOT_FOUND'));
    });
  });

  describe('When managing settings and runtime configurations', () => {
    it('Then it should persist and retrieve custom settings and runtime configs', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const custom: Settings = {
        autoStart: true,
        includePatchesInReports: false,
        activeSinks: ['Csv'],
        theme: 'dark',
        textAndIconSize: 'large',
        guiVariant: 'compact',
        alwaysOnTopSmall: true,
        alwaysOnTopMain: true,
        minimizeToTray: false,
      };

      // When
      await router.settings.save(custom);
      const fetched = await router.settings.get();

      // Then
      expect(fetched).toEqual(custom);

      // When
      const config1: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: 'val1', createdAt: '2026-06-15T12:00:00Z' };
      const config2: RuntimeConfig = { id: 'cfg2', runtime: 'browser', config: 'val2', createdAt: '2026-06-15T12:01:00Z' };
      await router.runtimeConfigs.save(config1);
      await router.runtimeConfigs.save(config2);
      const all = await router.runtimeConfigs.getAll();

      // Then
      expect(all).toHaveLength(2);
      expect(all.find(c => c.id === 'cfg1')?.config).toBe('val1');

      // When
      const config1Updated: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: 'val1-updated', createdAt: '2026-06-15T12:00:00Z' };
      await router.runtimeConfigs.save(config1Updated);
      const allUpdated = await router.runtimeConfigs.getAll();

      // Then
      expect(allUpdated.find(c => c.id === 'cfg1')?.config).toBe('val1-updated');
    });
  });

  describe('When managing time logs lifecycle', () => {
    it('Then it should insert, close by project, and close all active logs', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const state = await router.tasks.add({ projectId: 'proj-x', name: 'Task X', parentTaskId: null });
      const taskId = state.tasks[0].id;

      // When
      await router.timeLogs.insert('log-1', taskId, '2026-06-15T12:00:00Z');
      const logs = await router.timeLogs.getAll();
      const active = await router.timeLogs.queryActive();

      // Then
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('log-1');
      expect(logs[0].taskId).toBe(taskId);
      expect(active).toEqual([taskId]);

      // When
      await router.timeLogs.closeActiveByProject('2026-06-15T13:00:00Z', 'proj-x');
      const closedLogs = await router.timeLogs.getForTask(taskId);
      const activeAfterClose = await router.timeLogs.queryActive();

      // Then
      expect(closedLogs[0].endTime).toBe('2026-06-15T13:00:00Z');
      expect(activeAfterClose).toHaveLength(0);

      // When
      await router.timeLogs.insert('log-2', taskId, '2026-06-15T13:30:00Z');
      await router.timeLogs.closeAllActive('2026-06-15T14:00:00Z');
      const allLogs = await router.timeLogs.getAll();

      // Then
      expect(allLogs.find(l => l.id === 'log-2')?.endTime).toBe('2026-06-15T14:00:00Z');
    });
  });

  describe('When localStorage storage quota is exceeded', () => {
    it('Then it should report PersistenceException to ErrorHandler and throw error', async () => {
      // Given
      const router = PersistenceRouter.getInstance();
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

      // When & Then
      await expect(
        router.projects.add({ name: 'Failed Project', color: 'red' })
      ).rejects.toThrow('Quota exceeded');

      expect(errorHandlerSpy).toHaveBeenCalled();
      const passedError = errorHandlerSpy.mock.calls[0][0] as PersistenceException;
      expect(passedError).toBeInstanceOf(PersistenceException);
      expect(passedError.message).toBe('Failed to save persistence state to LocalStorage');
      expect(passedError.code).toBe('ERR_PERSISTENCE_SAVE');
    });
  });
});

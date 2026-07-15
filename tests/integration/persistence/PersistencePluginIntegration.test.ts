// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { PersistencePlugin } from '@plugins/persistence/PersistencePlugin';
import { setupLocalStorageMock } from '../../shared/mocks/browser-mocks';
import { PersistenceException, ErrorHandler } from '@common/exceptions';
import { RuntimeConfig } from '@bindings/RuntimeConfig';
import { Settings } from '@bindings/Settings';

describe('Integration Tests: PersistenceRouter with PersistencePlugin (LocalStorage)', () => {
  let _store: Record<string, string>;

  beforeEach(() => {
    vi.restoreAllMocks();
    _store = setupLocalStorageMock();

    PersistenceRouter.getInstance().setImplementationForTesting(new PersistencePlugin());
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Core State Management', () => {
    it('Given empty LocalStorage, When state is loaded, Then it should return default empty repository state', async () => {
      const router = PersistenceRouter.getInstance();
      const state = await router.core.load();
      expect(state).toEqual({
        projects: [],
        tasks: [],
        logs: [],
        activeLog: null,
      });
    });

    it('Given malformed JSON in LocalStorage, When state is loaded, Then it should return default state and trigger error handler', async () => {
      localStorage.setItem('timelog_persistence_plugin_state', 'invalid-json{');
      const router = PersistenceRouter.getInstance();
      const state = await router.core.load();
      expect(state).toEqual({
        projects: [],
        tasks: [],
        logs: [],
        activeLog: null,
      });
    });

    it('Given active state, When overrideState is called, Then it should merge partial state and persist changes', async () => {
      const router = PersistenceRouter.getInstance();
      const initial = await router.projects.add({ name: 'Project 1', color: 'blue' });
      const projId = initial.projects[0].id;

      const overridden = await router.core.overrideState({ activeLog: null });
      expect(overridden.projects[0].id).toBe(projId);
      expect(overridden.activeLog).toBeNull();
    });

    it('Given persistent states exist, When reset is called, Then it should clear storage and return default empty state', async () => {
      const router = PersistenceRouter.getInstance();
      await router.projects.add({ name: 'Project to Clear', color: 'red' });
      await router.settings.save({ autoStart: true, autoPauseOnSleep: true, includePatchesInReports: false, activeSinks: [] });

      const resetState = await router.core.reset();
      expect(resetState.projects).toHaveLength(0);
      expect(localStorage.getItem('timelog_persistence_plugin_state')).toBeNull();
      expect(localStorage.getItem('timelog_persistence_plugin_settings')).toBeNull();
    });
  });

  describe('Projects Management', () => {
    it('Given valid inputs, When project is added, Then it should generate UUID and push to list', async () => {
      const router = PersistenceRouter.getInstance();
      const state = await router.projects.add({
        name: 'Alpha Project',
        color: '#ffaa00',
        description: 'Testing desc',
        tags: ['test', 'dev']
      });

      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].id).toBeDefined();
      expect(state.projects[0].name).toBe('Alpha Project');
      expect(state.projects[0].color).toBe('#ffaa00');
      expect(state.projects[0].description).toBe('Testing desc');
      expect(state.projects[0].tags).toEqual(['test', 'dev']);
    });

    it('Given existing project, When toggled archived, Then it should invert the archive status', async () => {
      const router = PersistenceRouter.getInstance();
      const state1 = await router.projects.add({ name: 'Toggle Me', color: 'red' });
      const id = state1.projects[0].id;
      expect(state1.projects[0].archived).toBe(false);

      const state2 = await router.projects.toggleArchive(id);
      expect(state2.projects[0].archived).toBe(true);

      const state3 = await router.projects.toggleArchive(id);
      expect(state3.projects[0].archived).toBe(false);
    });

    it('Given existing project, When updated, Then it should update fields correctly', async () => {
      const router = PersistenceRouter.getInstance();
      const state1 = await router.projects.add({ name: 'Old Name', color: 'red' });
      const id = state1.projects[0].id;

      const state2 = await router.projects.update(id, 'New Name', 'green', 'Updated Desc', 'updated-icon', ['tag']);
      const proj = state2.projects[0];
      expect(proj.name).toBe('New Name');
      expect(proj.color).toBe('green');
      expect(proj.description).toBe('Updated Desc');
      expect(proj.icon).toBe('updated-icon');
      expect(proj.tags).toEqual(['tag']);
    });

    it('Given existing project, When renamed, Then it should only modify the name', async () => {
      const router = PersistenceRouter.getInstance();
      const state1 = await router.projects.add({ name: 'Original', color: 'blue' });
      const id = state1.projects[0].id;

      const state2 = await router.projects.rename(id, 'Renamed');
      expect(state2.projects[0].name).toBe('Renamed');
      expect(state2.projects[0].color).toBe('blue');
    });
  });

  describe('Tasks & Hierarchy Validation', () => {
    it('Given valid inputs, When root task is added, Then it should create a Todo task', async () => {
      const router = PersistenceRouter.getInstance();
      const state = await router.tasks.add({ projectId: 'p1', name: 'Root Task', parentTaskId: null });
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].name).toBe('Root Task');
      expect(state.tasks[0].parentTaskId).toBeUndefined();
      expect(state.tasks[0].status).toBe('Todo');
    });

    it('Given subtask added to root parent, When subtasks requested, Then it should return the children', async () => {
      const router = PersistenceRouter.getInstance();
      const state1 = await router.tasks.add({ projectId: 'p1', name: 'Root Parent', parentTaskId: null });
      const parentId = state1.tasks[0].id;

      const state2 = await router.tasks.add({ projectId: 'p1', name: 'Child Task', parentTaskId: parentId });
      expect(state2.tasks).toHaveLength(2);
      expect(state2.tasks[1].parentTaskId).toBe(parentId);

      const children = await router.tasks.getSubtasks(parentId);
      expect(children).toHaveLength(1);
      expect(children[0].name).toBe('Child Task');
    });

    it('Given nested subtask, When nesting more than one level deep, Then it should throw PersistenceException', async () => {
      const router = PersistenceRouter.getInstance();
      const state1 = await router.tasks.add({ projectId: 'p1', name: 'Level 0', parentTaskId: null });
      const id0 = state1.tasks[0].id;

      const state2 = await router.tasks.add({ projectId: 'p1', name: 'Level 1', parentTaskId: id0 });
      const id1 = state2.tasks[1].id;

      await expect(
        router.tasks.add({ projectId: 'p1', name: 'Level 2 (Illegal)', parentTaskId: id1 })
      ).rejects.toThrow(new PersistenceException('Cannot nest tasks more than one level deep', undefined, 'ERR_PERSISTENCE_HIERARCHY'));
    });

    it('Given task, When setting parent to itself, Then it should throw PersistenceException', async () => {
      const router = PersistenceRouter.getInstance();
      const state = await router.tasks.add({ projectId: 'p1', name: 'Selfish Task', parentTaskId: null });
      const id = state.tasks[0].id;

      await expect(
        router.tasks.update(id, 'Selfish Task', id, null, null)
      ).rejects.toThrow(new PersistenceException('Task cannot be its own parent', undefined, 'ERR_PERSISTENCE_HIERARCHY'));
    });

    it('Given task, When task completes or toggled complete, Then status should transition appropriately', async () => {
      const router = PersistenceRouter.getInstance();
      const state1 = await router.tasks.add({ projectId: 'p1', name: 'Complete Me', parentTaskId: null });
      const id = state1.tasks[0].id;

      const state2 = await router.tasks.toggleComplete(id);
      expect(state2.tasks[0].completed).toBe(true);
      expect(state2.tasks[0].status).toBe('Done');

      const state3 = await router.tasks.toggleComplete(id);
      expect(state3.tasks[0].completed).toBe(false);
      expect(state3.tasks[0].status).toBe('Todo');

      const state4 = await router.tasks.update(id, 'Complete Me', null, 'Done', null);
      expect(state4.tasks[0].completed).toBe(true);
    });

    it('Given nonexistent task, When fetching project ID, Then it should throw persistence exception', async () => {
      const router = PersistenceRouter.getInstance();
      await expect(
        router.tasks.getProjectId('nonexistent-id')
      ).rejects.toThrow(new PersistenceException('Task nonexistent-id not found', undefined, 'ERR_PERSISTENCE_TASK_NOT_FOUND'));
    });
  });

  describe('Settings & Runtime Configs', () => {
    it('Given default settings, When get is called, Then it should return default settings object', async () => {
      const router = PersistenceRouter.getInstance();
      const settings = await router.settings.get();
      expect(settings.autoPauseOnSleep).toBe(true);
      expect(settings.minimizeToTray).toBe(true);
    });

    it('Given custom settings, When saved and fetched, Then it should preserve values', async () => {
      const router = PersistenceRouter.getInstance();
      const custom: Settings = {
        autoStart: true,
        autoPauseOnSleep: false,
        includePatchesInReports: false,
        activeSinks: ['Csv'],
        theme: 'dark',
        textAndIconSize: 'large',
        guiVariant: 'compact',
        alwaysOnTopSmall: true,
        alwaysOnTopMain: true,
        minimizeToTray: false,
      };

      await router.settings.save(custom);
      const fetched = await router.settings.get();
      expect(fetched).toEqual(custom);
    });

    it('Given runtime configs, When saved and fetched, Then it should save and retrieve list correctly', async () => {
      const router = PersistenceRouter.getInstance();
      const config1: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: 'val1', createdAt: '2026-06-15T12:00:00Z' };
      const config2: RuntimeConfig = { id: 'cfg2', runtime: 'browser', config: 'val2', createdAt: '2026-06-15T12:01:00Z' };

      await router.runtimeConfigs.save(config1);
      await router.runtimeConfigs.save(config2);

      const all = await router.runtimeConfigs.getAll();
      expect(all).toHaveLength(2);
      expect(all.find(c => c.id === 'cfg1')?.config).toBe('val1');

      const config1Updated: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: 'val1-updated', createdAt: '2026-06-15T12:00:00Z' };
      await router.runtimeConfigs.save(config1Updated);
      const allUpdated = await router.runtimeConfigs.getAll();
      expect(allUpdated.find(c => c.id === 'cfg1')?.config).toBe('val1-updated');
    });
  });

  describe('Time Logs Lifecycle', () => {
    it('Given task, When new log inserted, Then it should set active log and persist', async () => {
      const router = PersistenceRouter.getInstance();
      const state = await router.tasks.add({ projectId: 'proj-x', name: 'Task X', parentTaskId: null });
      const taskId = state.tasks[0].id;

      await router.timeLogs.insert('log-1', taskId, '2026-06-15T12:00:00Z');
      const logs = await router.timeLogs.getAll();
      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('log-1');
      expect(logs[0].taskId).toBe(taskId);
      expect(logs[0].startTime).toBe('2026-06-15T12:00:00Z');
      expect(logs[0].endTime).toBeUndefined();

      const active = await router.timeLogs.queryActive();
      expect(active).toEqual([taskId]);
    });

    it('Given running timer, When closeActiveByProject is called, Then it should set endTime for that project task logs', async () => {
      const router = PersistenceRouter.getInstance();
      const state = await router.tasks.add({ projectId: 'proj-y', name: 'Task Y', parentTaskId: null });
      const taskId = state.tasks[0].id;

      await router.timeLogs.insert('log-2', taskId, '2026-06-15T12:00:00Z');
      await router.timeLogs.closeActiveByProject('2026-06-15T13:00:00Z', 'proj-y');

      const logs = await router.timeLogs.getForTask(taskId);
      expect(logs[0].endTime).toBe('2026-06-15T13:00:00Z');

      const active = await router.timeLogs.queryActive();
      expect(active).toHaveLength(0);
    });

    it('Given running timer, When closeAllActive is called, Then it should close all running logs', async () => {
      const router = PersistenceRouter.getInstance();
      const state = await router.tasks.add({ projectId: 'proj-z', name: 'Task Z', parentTaskId: null });
      const taskId = state.tasks[0].id;

      await router.timeLogs.insert('log-3', taskId, '2026-06-15T12:00:00Z');
      await router.timeLogs.closeAllActive('2026-06-15T14:00:00Z');

      const logs = await router.timeLogs.getAll();
      expect(logs[0].endTime).toBe('2026-06-15T14:00:00Z');

      const active = await router.timeLogs.queryActive();
      expect(active).toHaveLength(0);
    });
  });

  describe('Quota Exceeded / Persistence Failures', () => {
    it('Given localStorage setItem throwing error, When save is invoked, Then it should report PersistenceException to ErrorHandler and throw original error', async () => {
      const router = PersistenceRouter.getInstance();
      const errorHandlerSpy = vi.spyOn(ErrorHandler, 'handle');

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Quota exceeded');
      });

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

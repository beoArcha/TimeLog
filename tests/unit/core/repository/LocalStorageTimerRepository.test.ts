import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageTimerRepository } from '@plugins/persistence/localstorage/LocalStorageTimerRepository';
import { setupLocalStorageMock } from '../../../shared/test-helpers';
import { STORAGE_KEYS } from '@common/constants';

describe('Unit Tests: LocalStorageTimerRepository', () => {
  let repository: LocalStorageTimerRepository;

  beforeEach(() => {
    setupLocalStorageMock();
    repository = new LocalStorageTimerRepository();
  });

  it('should return null when loading empty repository state', async () => {
    localStorage.removeItem(STORAGE_KEYS.STATE_DB);
    const state = await repository.load();
    expect(state).toBeNull();
  });

  it('should load saved MVP state', async () => {
    const raw = {
      projects: [{ id: 'p1', name: 'Proj 1', color: 'blue', createdAt: '', archived: false }],
      tasks: [{ id: 't1', projectId: 'p1', name: 'Task 1', createdAt: '', completed: false }],
      logs: [],
      activeLog: null,
    };
    localStorage.setItem(STORAGE_KEYS.STATE_DB, JSON.stringify(raw));

    const state = await repository.load();
    expect(state).not.toBeNull();
    expect(state?.projects).toHaveLength(1);
    expect(state?.projects[0].name).toBe('Proj 1');
  });

  it('should partial merge and preserve out-of-scope fields', async () => {
    const original = {
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
      holidays: [{ id: 'h1', date: '2026-12-25', name: 'Christmas' }],
      patches: ['patch_1'],
    };
    localStorage.setItem(STORAGE_KEYS.STATE_DB, JSON.stringify(original));

    await repository.addProject({ name: 'New Project', color: 'green' });

    const rawStored = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATE_DB) || '{}');
    expect(rawStored.projects).toHaveLength(1);
    expect(rawStored.holidays).toHaveLength(1);
    expect(rawStored.holidays[0].name).toBe('Christmas');
    expect(rawStored.patches).toHaveLength(1);
  });

  it('should add, rename, toggle, and delete projects and tasks', async () => {
    // 1. Add project
    let state = await repository.addProject({ name: 'My Proj', color: 'red' });
    expect(state.projects).toHaveLength(1);
    const pId = state.projects[0].id;

    // 2. Add task
    state = await repository.addTask({ projectId: pId, name: 'My Task', parentTaskId: null });
    expect(state.tasks).toHaveLength(1);
    const tId = state.tasks[0].id;

    // 3. Rename task
    state = await repository.renameTask(tId, 'Renamed Task');
    expect(state.tasks[0].name).toBe('Renamed Task');

    // 4. Toggle project archive
    state = await repository.toggleProjectArchive(pId);
    expect(state.projects[0].archived).toBe(true);

    // 5. Delete task
    state = await repository.deleteTask(tId);
    expect(state.tasks).toHaveLength(0);
  });

  it('should start and stop timer, returning generated events', async () => {
    let state = await repository.addProject({ name: 'P1', color: 'red' });
    const pId = state.projects[0].id;
    state = await repository.addTask({ projectId: pId, name: 'T1', parentTaskId: null });
    const tId = state.tasks[0].id;

    const startRes = await repository.startTimer(tId);
    expect(startRes.state.activeLog).not.toBeNull();
    expect(startRes.state.activeLog?.taskId).toBe(tId);
    expect(startRes.events).toHaveLength(1);
    expect(startRes.events[0].event).toBe('START');

    const stopRes = await repository.stopTimer(pId);
    expect(stopRes.state.activeLog).toBeNull();
    expect(stopRes.events).toHaveLength(1);
    expect(stopRes.events[0].event).toBe('TERMINATE');
  });

  it('should reset only MVP fields when reset is called', async () => {
    const original = {
      projects: [{ id: 'p1', name: 'Proj 1', color: 'blue', createdAt: '', archived: false }],
      tasks: [],
      logs: [],
      activeLog: null,
      holidays: [{ id: 'h1', date: '2026-12-25', name: 'Christmas' }],
    };
    localStorage.setItem(STORAGE_KEYS.STATE_DB, JSON.stringify(original));

    const state = await repository.reset();
    expect(state.projects).toHaveLength(0);

    const rawStored = JSON.parse(localStorage.getItem(STORAGE_KEYS.STATE_DB) || '{}');
    expect(rawStored.projects).toBeUndefined();
    expect(rawStored.holidays).toHaveLength(1);
  });
});

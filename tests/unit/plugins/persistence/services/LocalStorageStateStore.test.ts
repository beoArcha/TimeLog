import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocalStorageStateStore } from '@plugins/persistence/services/LocalStorageStateStore';
import { STORAGE_KEYS } from '@common/constants/storage-keys';
import { aProject, aTask, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('LocalStorageStateStore', () => {
  let store: LocalStorageStateStore;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    store = new LocalStorageStateStore();
  });

  it('should return clean empty state when loaded for first time on empty storage', async () => {
    // Arrange: empty localStorage

    // Act
    const result = await store.load();

    // Assert
    expect(result).not.toBeNull();
    expect(result?.projects).toHaveLength(0);
    expect(result?.tasks).toHaveLength(0);
    expect(result?.logs).toHaveLength(0);
    expect(result?.activeLog).toBeNull();
  });

  it('should return parsed state from storage when state data exists', async () => {
    // Arrange
    const sampleState = {
      projects: [aProject({ id: 'p-1', name: 'Saved Project' })],
      tasks: [aTask({ id: 't-1', projectId: 'p-1' })],
      logs: [aTimeLog({ id: 'l-1', taskId: 't-1' })],
      activeLog: null,
    };
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, JSON.stringify(sampleState));

    // Act
    const result = await store.load();

    // Assert
    expect(result).toEqual(sampleState);
  });

  it('should throw PersistenceException and quarantine storage when stored JSON is invalid', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, 'invalid-json{{{');

    // Act
    const loadPromise = store.load();

    // Assert
    await expect(loadPromise).rejects.toThrow('quarantined to prevent data loss');
  });

  it('should block subsequent save operations when storage is in quarantined state', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, 'invalid-json{{{');
    await expect(store.load()).rejects.toThrow();

    // Act
    const savePromise = store.save({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Assert
    await expect(savePromise).rejects.toThrow('quarantined corrupted state');
  });

  it('should reset quarantine state when explicit reset is called', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, 'invalid-json{{{');
    await expect(store.load()).rejects.toThrow();
    await store.reset();

    // Act
    const afterReset = await store.save({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    // Assert
    expect(afterReset).toBeDefined();
  });

  it('should serialize and persist state to localStorage when save is called', async () => {
    // Arrange
    const stateToSave = {
      projects: [aProject({ id: 'p-save', name: 'Persisted' })],
      tasks: [],
      logs: [],
      activeLog: null,
    };

    // Act
    const saved = await store.save(stateToSave);

    // Assert
    expect(saved).toEqual(stateToSave);
    const raw = localStorage.getItem(STORAGE_KEYS.STORAGE_KEY);
    expect(raw).toBe(JSON.stringify(stateToSave));
  });

  it('should clear all domains and return empty state when reset is called without scope (defaults to ALL)', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, '{"projects":[{"id":"p1"}]}');
    localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    localStorage.setItem(STORAGE_KEYS.RUN_CONFIGS_KEY, '[]');

    // Act
    const resetState = await store.reset();

    // Assert
    expect(resetState).toEqual({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });
    expect(localStorage.getItem(STORAGE_KEYS.STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.RUN_CONFIGS_KEY)).toBeNull();
  });

  it('should clear only business domain keys and preserve settings and system keys when reset is called with BUSINESS scope', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, '{"projects":[{"id":"p1"}]}');
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJ_ID, 'p1');
    localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    localStorage.setItem(STORAGE_KEYS.RUN_CONFIGS_KEY, '[]');

    // Act
    const resetState = await store.reset('BUSINESS');

    // Assert
    expect(resetState).toEqual({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });
    expect(localStorage.getItem(STORAGE_KEYS.STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.CURRENT_PROJ_ID)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('dark');
    expect(localStorage.getItem(STORAGE_KEYS.RUN_CONFIGS_KEY)).toBe('[]');
  });

  it('should clear only settings domain keys and preserve business state when reset is called with SETTINGS scope', async () => {
    // Arrange
    const businessState = {
      projects: [aProject({ id: 'p-keep', name: 'Keep Me' })],
      tasks: [],
      logs: [],
      activeLog: null,
    };
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, JSON.stringify(businessState));
    localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    localStorage.setItem(STORAGE_KEYS.RUN_CONFIGS_KEY, '[]');

    // Act
    const returnedState = await store.reset('SETTINGS');

    // Assert
    expect(returnedState).toEqual(businessState);
    expect(localStorage.getItem(STORAGE_KEYS.STORAGE_KEY)).toBe(JSON.stringify(businessState));
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.RUN_CONFIGS_KEY)).toBe('[]');
  });

  it('should clear only system domain keys and preserve business and settings keys when reset is called with SYSTEM scope', async () => {
    // Arrange
    const businessState = {
      projects: [aProject({ id: 'p-keep-2', name: 'Keep Me Too' })],
      tasks: [],
      logs: [],
      activeLog: null,
    };
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, JSON.stringify(businessState));
    localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    localStorage.setItem(STORAGE_KEYS.RUN_CONFIGS_KEY, '["some-config"]');

    // Act
    const returnedState = await store.reset('SYSTEM');

    // Assert
    expect(returnedState).toEqual(businessState);
    expect(localStorage.getItem(STORAGE_KEYS.STORAGE_KEY)).toBe(JSON.stringify(businessState));
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('light');
    expect(localStorage.getItem(STORAGE_KEYS.RUN_CONFIGS_KEY)).toBeNull();
  });

  it('should clear selected multiple domains when reset is called with domain array', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, '{"projects":[{"id":"p1"}]}');
    localStorage.setItem(STORAGE_KEYS.THEME, 'cyberpunk');
    localStorage.setItem(STORAGE_KEYS.RUN_CONFIGS_KEY, '["sys"]');

    // Act
    const resetState = await store.reset(['BUSINESS', 'SYSTEM']);

    // Assert
    expect(resetState).toEqual({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });
    expect(localStorage.getItem(STORAGE_KEYS.STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.RUN_CONFIGS_KEY)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe('cyberpunk');
  });
});

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

  it('should return clean empty state on first load when storage is empty', async () => {
    // Act
    const result = await store.load();

    // Assert
    expect(result).not.toBeNull();
    expect(result?.projects).toHaveLength(0);
    expect(result?.tasks).toHaveLength(0);
    expect(result?.logs).toHaveLength(0);
    expect(result?.activeLog).toBeNull();
  });

  it('should return parsed state from storage when data exists', async () => {
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

    // Act & Assert
    await expect(store.load()).rejects.toThrow('quarantined to prevent data loss');

    // Assert subsequent save is blocked by quarantine
    await expect(
      store.save({
        projects: [],
        tasks: [],
        logs: [],
        activeLog: null,
      })
    ).rejects.toThrow('quarantined corrupted state');
  });

  it('should reset quarantine state on explicit reset', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, 'invalid-json{{{');
    await expect(store.load()).rejects.toThrow();

    // Act
    await store.reset();

    // Assert
    const afterReset = await store.save({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });
    expect(afterReset).toBeDefined();
  });

  it('should serialize and persist state to localStorage on save', async () => {
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

  it('should clear all storage keys and return empty state on reset', async () => {
    // Arrange
    localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, '{"projects":[]}');
    localStorage.setItem(STORAGE_KEYS.SETTINGS_KEY, '{"theme":"dark"}');
    localStorage.setItem(STORAGE_KEYS.RUN_CONFIGS_KEY, '[]');
    localStorage.setItem(STORAGE_KEYS.HOLIDAYS_KEY, '[]');

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
    expect(localStorage.getItem(STORAGE_KEYS.SETTINGS_KEY)).toBeNull();
  });
});

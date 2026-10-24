import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LocalStorageDataManager } from '@plugins/persistence/DataManager';
import { setupLocalStorageMock } from '@tests/shared/test-helpers';
import { FullAppState } from '@plugins/persistence/DataManager';

const TEST_KEY = 'test_storage_key';

const buildEmptyState = (): FullAppState => ({
  projects: [],
  tasks: [],
  logs: [],
  holidays: [],
  patches: [],
  activeLog: null,
});

describe('Unit Tests: LocalStorageDataManager', () => {
  let manager: LocalStorageDataManager;

  beforeEach(() => {
    setupLocalStorageMock();
    manager = new LocalStorageDataManager(TEST_KEY);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadState', () => {
    it('should return null when no stored data exists', () => {
      // Act
      const state = manager.loadState();

      // Assert
      expect(state).toBeNull();
    });

    it('should parse and return state when valid JSON is stored', () => {
      // Arrange
      const stored = buildEmptyState();
      stored.projects.push({ id: 'p1', name: 'Proj', color: 'red', createdAt: '2026' });
      localStorage.setItem(TEST_KEY, JSON.stringify(stored));

      // Act
      const state = manager.loadState();

      // Assert
      expect(state).not.toBeNull();
      expect(state!.projects).toHaveLength(1);
      expect(state!.projects[0].id).toBe('p1');
    });

    it('should throw PersistenceException and quarantine storage when stored JSON is invalid', () => {
      // Arrange
      localStorage.setItem(TEST_KEY, 'not-valid-json');

      // Act & Assert
      expect(() => manager.loadState()).toThrow('state quarantined to prevent data loss');
    });
  });

  describe('saveState', () => {
    it('should serialize and persist state to localStorage', () => {
      // Arrange
      const state = buildEmptyState();
      state.projects.push({ id: 'p1', name: 'Saved', color: 'blue', createdAt: '2026' });

      // Act
      manager.saveState(state);

      // Assert
      const raw = localStorage.getItem(TEST_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.projects[0].name).toBe('Saved');
    });

    it('should block saveState when storage is quarantined in corrupted state', () => {
      // Arrange
      localStorage.setItem(TEST_KEY, 'not-valid-json');
      expect(() => manager.loadState()).toThrow();

      // Act & Assert
      const state = buildEmptyState();
      expect(() => manager.saveState(state)).toThrow('corrupted quarantine state');
    });

    it('should rethrow PersistenceException when localStorage.setItem fails', () => {
      // Arrange
      const state = buildEmptyState();
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      // Act & Assert
      expect(() => manager.saveState(state)).toThrow('Failed to save state to localStorage');
    });
  });

  describe('clearState', () => {
    it('should remove stored state and reset quarantine', () => {
      // Arrange
      localStorage.setItem(TEST_KEY, 'corrupt-json');
      expect(() => manager.loadState()).toThrow();

      // Act
      manager.clearState();

      // Assert
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
      const validState = buildEmptyState();
      expect(() => manager.saveState(validState)).not.toThrow();
    });
  });

  describe('getNextId (static)', () => {
    it('Given empty items array, Then it should return prefix + 1', () => {
      const id = LocalStorageDataManager.getNextId([], 'p');
      expect(id).toBe('p1');
    });

    it('Given items with numeric suffix and prefix, Then it should return max + 1', () => {
      const items = [{ id: 'p1' }, { id: 'p3' }, { id: 'p2' }];
      const id = LocalStorageDataManager.getNextId(items, 'p');
      expect(id).toBe('p4');
    });

    it('Given items without prefix, Then it should extract numeric part', () => {
      const items = [{ id: '5' }, { id: '2' }];
      const id = LocalStorageDataManager.getNextId(items, '');
      expect(id).toBe('6');
    });

    it('Given items with non-numeric ids and no prefix match, Then it should default to 1', () => {
      const items = [{ id: 'abc' }, { id: 'xyz' }];
      const id = LocalStorageDataManager.getNextId(items, 'p');
      expect(id).toBe('p1');
    });

    it('Given items with large gaps, Then it should calculate next sequential id from max value', () => {
      const items = [{ id: '10' }, { id: '99' }];
      const id = LocalStorageDataManager.getNextId(items, '');
      expect(id).toBe('100');
    });
  });

  describe('getNextId (instance)', () => {
    it('Given items, Then instance method should delegate to static method', () => {
      const items = [{ id: 'item1' }, { id: 'item3' }];
      const id = manager.getNextId(items, 'item');
      expect(id).toBe('item4');
    });
  });
});

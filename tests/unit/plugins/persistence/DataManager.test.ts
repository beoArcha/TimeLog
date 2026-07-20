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
    it('Given no stored data, Then it should return null', () => {
      const state = manager.loadState();
      expect(state).toBeNull();
    });

    it('Given valid JSON stored, Then it should parse and return state', () => {
      const stored = buildEmptyState();
      stored.projects.push({ id: 'p1', name: 'Proj', color: 'red', createdAt: '2026' });
      localStorage.setItem(TEST_KEY, JSON.stringify(stored));

      const state = manager.loadState();
      expect(state).not.toBeNull();
      expect(state!.projects).toHaveLength(1);
      expect(state!.projects[0].id).toBe('p1');
    });

    it('Given invalid JSON stored, Then it should return null and not throw', () => {
      localStorage.setItem(TEST_KEY, 'not-valid-json');
      const state = manager.loadState();
      expect(state).toBeNull();
    });
  });

  describe('saveState', () => {
    it('Given valid state, Then it should serialize it to localStorage', () => {
      const state = buildEmptyState();
      state.projects.push({ id: 'p1', name: 'Saved', color: 'blue', createdAt: '2026' });
      manager.saveState(state);

      const raw = localStorage.getItem(TEST_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.projects[0].name).toBe('Saved');
    });
  });

  describe('clearState', () => {
    it('Given stored state, Then clearState should remove it', () => {
      const state = buildEmptyState();
      manager.saveState(state);
      expect(localStorage.getItem(TEST_KEY)).not.toBeNull();

      manager.clearState();
      expect(localStorage.getItem(TEST_KEY)).toBeNull();
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
  });

  describe('getNextId (instance)', () => {
    it('Given items, Then instance method should delegate to static method', () => {
      const items = [{ id: 'item1' }, { id: 'item3' }];
      const id = manager.getNextId(items, 'item');
      expect(id).toBe('item4');
    });
  });
});

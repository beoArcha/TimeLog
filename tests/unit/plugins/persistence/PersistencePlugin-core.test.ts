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

describe('Unit Tests: PersistencePlugin - Core, Settings & RuntimeConfigs', () => {
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

  describe('core persistence', () => {
    it('should return default state when localstorage is empty', async () => {
      // Arrange & Act
      const state = await plugin.core.load();

      // Assert
      expect(state).toEqual({ projects: [], tasks: [], logs: [], activeLog: null });
    });

    it('should load state from localstorage', async () => {
      // Arrange
      const mockState = {
        projects: [{ id: 'p1', name: 'Project 1', color: '#000', createdAt: 'date' }],
        tasks: [],
        logs: [],
        activeLog: null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockState));

      // Act
      const state = await plugin.core.load();

      // Assert
      expect(state).toEqual(mockState);
    });

    it('should throw PersistenceException when stored JSON is corrupted', async () => {
      // Arrange
      localStorage.setItem(STORAGE_KEY, 'invalid json');

      // Act & Assert
      await expect(plugin.core.load()).rejects.toThrow();
    });

    it('should override state', async () => {
      // Arrange
      const newState = { projects: [{ id: 'p1', name: 'P1', color: '#000', createdAt: 'date' }] };

      // Act
      const state = await plugin.core.overrideState(newState as Parameters<typeof plugin.core.overrideState>[0]);

      // Assert
      expect(state.projects).toHaveLength(1);
      expect(state.projects[0].name).toBe('P1');
    });

    it('should preserve existing tasks and logs when overriding only projects', async () => {
      // Arrange
      await plugin.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });
      const beforeState = await plugin.core.load();
      expect(beforeState?.tasks).toHaveLength(1);

      // Act
      const updatedState = await plugin.core.overrideState({
        projects: [{ id: 'p2', name: 'Project 2', color: '#fff', createdAt: 'date' }],
      });

      // Assert
      expect(updatedState.projects).toHaveLength(1);
      expect(updatedState.projects[0].id).toBe('p2');
      expect(updatedState.tasks).toHaveLength(1);
      expect(updatedState.tasks[0].name).toBe('Task 1');
    });

    it('should reset state and clear all keys', async () => {
      // Arrange
      await plugin.projects.add({ name: 'Project', color: '#000' });
      await plugin.settings.save({ autoStart: true, includePatchesInReports: false, activeSinks: [] });

      // Act
      const state = await plugin.core.reset();

      // Assert
      expect(state.projects).toHaveLength(0);
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(localStorage.getItem(SETTINGS_KEY)).toBeNull();
      expect(localStorage.getItem(RUN_CONFIGS_KEY)).toBeNull();
    });
  });

  describe('settings persistence', () => {
    it('should return default settings with no stored data', async () => {
      // Arrange & Act
      const settings = await plugin.settings.get();

      // Assert
      expect(settings.autoStart).toBe(false);
      expect(settings.includePatchesInReports).toBe(true);
      expect(settings.theme).toBe('system');
      expect(settings.textAndIconSize).toBe('medium');
    });

    it('should merge stored partial settings with defaults', async () => {
      // Arrange
      localStorage.setItem(SETTINGS_KEY, JSON.stringify({ autoStart: true }));

      // Act
      const settings = await plugin.settings.get();

      // Assert
      expect(settings.autoStart).toBe(true);
    });

    it('should return default settings with invalid JSON', async () => {
      // Arrange
      localStorage.setItem(SETTINGS_KEY, 'bad-json');

      // Act
      const settings = await plugin.settings.get();

      // Assert
      expect(settings.autoStart).toBe(false);
    });

    it('should persist settings to localStorage', async () => {
      // Arrange
      const newSettings = { autoStart: true, includePatchesInReports: false, activeSinks: [] as string[] };

      // Act
      await plugin.settings.save(newSettings as Parameters<typeof plugin.settings.save>[0]);

      // Assert
      const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      expect(stored.autoStart).toBe(true);
    });
  });

  describe('runtimeConfigs persistence', () => {
    it('should return empty array when no runtime configs are stored', async () => {
      // Arrange & Act
      const configs = await plugin.runtimeConfigs.getAll();

      // Assert
      expect(configs).toEqual([]);
    });

    it('should persist new runtime config', async () => {
      // Arrange
      const cfg: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: '{}', createdAt: '2026-01-01T00:00:00Z' };

      // Act
      await plugin.runtimeConfigs.save(cfg);
      const configs = await plugin.runtimeConfigs.getAll();

      // Assert
      expect(configs).toHaveLength(1);
      expect(configs[0].id).toBe('cfg1');
    });

    it('should update existing runtime config in place by id', async () => {
      // Arrange
      const original: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: '{"v":1}', createdAt: '2026-01-01T00:00:00Z' };
      await plugin.runtimeConfigs.save(original);
      const updated: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: '{"v":2}', createdAt: '2026-01-01T00:00:00Z' };

      // Act
      await plugin.runtimeConfigs.save(updated);
      const configs = await plugin.runtimeConfigs.getAll();

      // Assert
      expect(configs).toHaveLength(1);
      expect(configs[0].config).toBe('{"v":2}');
    });

    it('should keep all configs when multiple runtime configs are saved', async () => {
      // Arrange
      const cfg1: RuntimeConfig = { id: 'cfg1', runtime: 'browser', config: '{}', createdAt: '2026-01-01T00:00:00Z' };
      const cfg2: RuntimeConfig = { id: 'cfg2', runtime: 'tauri', config: '{}', createdAt: '2026-01-01T00:00:00Z' };

      // Act
      await plugin.runtimeConfigs.save(cfg1);
      await plugin.runtimeConfigs.save(cfg2);
      const configs = await plugin.runtimeConfigs.getAll();

      // Assert
      expect(configs).toHaveLength(2);
    });
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import { ErrorHandler } from '@common/exceptions';
import { aHolidayLeave, aPatchLog, aTimeLog } from '@tests/shared/builders/entity-builders';

describe('Unit Tests: PersistenceCommands', () => {
  let commands: PersistenceCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    commands = new PersistenceCommands();
  });

  describe('core persistence', () => {
    it('should call get_state on load and return populated state', async () => {
      // Arrange
      const mockState = {
        projects: [{ id: 'p1', name: 'Proj 1', color: 'blue' }],
        tasks: [{ id: 't1', name: 'Task 1' }],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValue(mockState);

      // Act
      const result = await commands.core.load();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_state');
      expect(result).toEqual(mockState);
    });

    it('should return null on load if state has empty projects and tasks', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({ projects: [], tasks: [], logs: [], activeLog: null });

      // Act
      const result = await commands.core.load();

      // Assert
      expect(result).toBeNull();
    });

    it('should return null on load if state is malformed or null', async () => {
      // Arrange
      mockInvoke.mockResolvedValue(null);

      // Act
      const result = await commands.core.load();

      // Assert
      expect(result).toBeNull();
    });

    it('should handle error and rethrow on load failure', async () => {
      // Arrange
      const err = new Error('Tauri load error');
      mockInvoke.mockRejectedValue(err);

      // Act & Assert
      await expect(commands.core.load()).rejects.toThrow('Tauri load error');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });

    it('should call override_state and reload state', async () => {
      // Arrange
      const mockState = {
        projects: [{ id: 'p1', name: 'Proj 1', color: 'blue' }],
        tasks: [],
      };
      mockInvoke.mockResolvedValue(mockState);

      // Act
      const result = await commands.core.overrideState({ projects: mockState.projects as never });

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('override_state', {
        state: { projects: mockState.projects },
      });
      expect(result).toEqual(mockState);
    });

    it('should call reset command', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({ projects: [], tasks: [], logs: [], activeLog: null });

      // Act
      const result = await commands.core.reset();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('reset');
      expect(result).toEqual({ projects: [], tasks: [], logs: [], activeLog: null });
    });
  });

  describe('projects persistence', () => {
    it('should call add with project input', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({});

      // Act
      await commands.projects.add({ name: 'Project 1', color: 'red' });

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('add', {
        name: 'Project 1',
        color: 'red',
        description: null,
        icon: null,
        tags: null,
      });
    });

    it('should call toggle_archive', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({});

      // Act
      await commands.projects.toggleArchive('p1');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('toggle_archive', { projectId: 'p1' });
    });

    it('should call update_project on update and rename', async () => {
      // Arrange
      const mockState = {
        projects: [
          { id: 'p1', name: 'Old', color: '#ff0000', description: null, icon: null, tags: null },
        ],
        tasks: [],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValue(mockState);

      // Act
      await commands.projects.update('p1', 'New Name', '#00ff00', null, null, null);
      await commands.projects.rename('p1', 'Renamed');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('update_project', {
        projectId: 'p1',
        name: 'New Name',
        color: '#00ff00',
        description: null,
        icon: null,
        tags: null,
      });
      expect(mockInvoke).toHaveBeenCalledWith('update_project', {
        projectId: 'p1',
        name: 'Renamed',
        color: '#ff0000',
        description: null,
        icon: null,
        tags: null,
      });
    });
  });

  describe('tasks persistence', () => {
    it('should call create when adding task', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({});

      // Act
      await commands.tasks.add({ projectId: 'p1', name: 'Task 1', parentTaskId: null });

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('create', {
        projectId: 'p1',
        name: 'Task 1',
        parentTaskId: null,
      });
    });

    it('should call update_task when updating and renaming', async () => {
      // Arrange
      const mockState = {
        projects: [],
        tasks: [
          { id: 't1', name: 'Old Task', projectId: 'p1', parentTaskId: null, status: null, completed: false },
        ],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValue(mockState);

      // Act
      await commands.tasks.update('t1', 'New Task', null, 'Todo', false);
      await commands.tasks.rename('t1', 'Renamed Task');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('update_task', {
        taskId: 't1',
        name: 'New Task',
        parentTaskId: null,
        status: 'Todo',
        completed: false,
      });
      expect(mockInvoke).toHaveBeenCalledWith('update_task', {
        taskId: 't1',
        name: 'Renamed Task',
        parentTaskId: null,
        status: null,
        completed: false,
      });
    });

    it('should call delete and toggle_complete', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({});

      // Act
      await commands.tasks.delete('t1');
      await commands.tasks.toggleComplete('t1');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('delete', { taskId: 't1' });
      expect(mockInvoke).toHaveBeenCalledWith('toggle_complete', { taskId: 't1' });
    });

    it('should getProjectId and getSubtasks correctly', async () => {
      // Arrange
      const mockState = {
        projects: [],
        tasks: [
          { id: 't1', name: 'Parent', projectId: 'p1', parentTaskId: null },
          { id: 'sub-1', name: 'Subtask', projectId: 'p1', parentTaskId: 't1' },
        ],
        logs: [],
        activeLog: null,
      };
      mockInvoke.mockResolvedValue(mockState);

      // Act
      const projectId = await commands.tasks.getProjectId('t1');
      const subtasks = await commands.tasks.getSubtasks('t1');

      // Assert
      expect(projectId).toBe('p1');
      expect(subtasks).toHaveLength(1);
      expect(subtasks[0].id).toBe('sub-1');
    });

    it('should throw error when getProjectId is called for non-existent task', async () => {
      // Arrange
      mockInvoke.mockResolvedValue({ projects: [], tasks: [], logs: [], activeLog: null });

      // Act & Assert
      await expect(commands.tasks.getProjectId('unknown-task')).rejects.toThrow(
        'Task unknown-task not found'
      );
    });
  });

  describe('settings persistence', () => {
    it('should call get settings and handle errors', async () => {
      // Arrange
      const mockSettings = { autoStart: true, minimizeToTray: false };
      mockInvoke.mockResolvedValue(mockSettings);

      // Act
      const result = await commands.settings.get();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get');
      expect(result).toEqual(mockSettings);

      // Error case
      mockInvoke.mockRejectedValue(new Error('Settings fetch failed'));
      await expect(commands.settings.get()).rejects.toThrow('Settings fetch failed');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });

    it('should call save settings and handle errors', async () => {
      // Arrange
      const mockSettings = { autoStart: true, minimizeToTray: false };
      mockInvoke.mockResolvedValue(undefined);

      // Act
      await commands.settings.save(mockSettings as never);

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('save', { settings: mockSettings });

      // Error case
      mockInvoke.mockRejectedValue(new Error('Settings save failed'));
      await expect(commands.settings.save(mockSettings as never)).rejects.toThrow('Settings save failed');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });

  describe('runtimeConfigs persistence', () => {
    it('should call save_runtime_config and get_runtime_configs', async () => {
      // Arrange
      const mockConfig = { id: 'cfg-1', key: 'api_url', value: 'http://localhost' };
      mockInvoke.mockResolvedValue([mockConfig]);

      // Act
      await commands.runtimeConfigs.save(mockConfig as never);
      const allConfigs = await commands.runtimeConfigs.getAll();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('save_runtime_config', { config: mockConfig });
      expect(mockInvoke).toHaveBeenCalledWith('get_runtime_configs');
      expect(allConfigs).toEqual([mockConfig]);
    });

    it('should handle errors in runtimeConfigs methods', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('Runtime config error'));

      // Act & Assert
      await expect(commands.runtimeConfigs.save({} as never)).rejects.toThrow('Runtime config error');
      await expect(commands.runtimeConfigs.getAll()).rejects.toThrow('Runtime config error');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });

  describe('timeLogs persistence', () => {
    it('should invoke all timeLogs persistence commands when called', async () => {
      // Arrange
      const mockLog = aTimeLog({ id: 'l1', taskId: 't1' });
      mockInvoke.mockResolvedValue([mockLog]);

      // Act
      const forTask = await commands.timeLogs.getForTask('t1');
      await commands.timeLogs.closeActiveByProject('2026-01-01T01:00:00Z', 'p1');
      await commands.timeLogs.closeAllActive('2026-01-01T01:00:00Z');
      await commands.timeLogs.insert('l2', 't1', '2026-01-01T02:00:00Z');
      mockInvoke.mockResolvedValue(['l1']);
      const activeIds = await commands.timeLogs.queryActive();
      mockInvoke.mockResolvedValue([mockLog]);
      const allLogs = await commands.timeLogs.getAll();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_for_task', { taskId: 't1' });
      expect(mockInvoke).toHaveBeenCalledWith('close_active_by_project', {
        endTime: '2026-01-01T01:00:00Z',
        projectId: 'p1',
      });
      expect(mockInvoke).toHaveBeenCalledWith('close_all_active', {
        endTime: '2026-01-01T01:00:00Z',
      });
      expect(mockInvoke).toHaveBeenCalledWith('insert', {
        logId: 'l2',
        taskId: 't1',
        startTime: '2026-01-01T02:00:00Z',
      });
      expect(mockInvoke).toHaveBeenCalledWith('query_active');
      expect(activeIds).toEqual(['l1']);
      expect(mockInvoke).toHaveBeenCalledWith('get_all');
      expect(allLogs).toEqual([mockLog]);
      expect(forTask).toEqual([mockLog]);
    });

    it('should invoke delete_time_log when delete is called', async () => {
      // Arrange
      mockInvoke.mockResolvedValue(undefined);

      // Act
      await commands.timeLogs.delete('log_del_1');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('delete_time_log', { logId: 'log_del_1' });
    });

    it('should report exception and rethrow when delete fails', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('Tauri delete log error'));

      // Act & Assert
      await expect(commands.timeLogs.delete('log_del_fail')).rejects.toThrow('Tauri delete log error');
      expect(ErrorHandler.handle).toHaveBeenCalled();
    });
  });

  describe('holidays persistence', () => {
    it('should invoke get_holidays and return list when getAll is called', async () => {
      // Arrange
      const mockHolidays = [aHolidayLeave({ id: 'hol_1', name: 'Test Holiday' })];
      mockInvoke.mockResolvedValue(mockHolidays);

      // Act
      const result = await commands.holidays.getAll();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_holidays');
      expect(result).toEqual(mockHolidays);
    });

    it('should invoke save_holidays with payload when save is called', async () => {
      // Arrange
      const mockHolidays = [aHolidayLeave({ id: 'hol_1' })];
      mockInvoke.mockResolvedValue(undefined);

      // Act
      await commands.holidays.save(mockHolidays);

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('save_holidays', { holidays: mockHolidays });
    });

    it('should report exception and rethrow when holidays invocation fails', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('Holidays error'));

      // Act & Assert
      await expect(commands.holidays.getAll()).rejects.toThrow('Holidays error');
      await expect(commands.holidays.save([])).rejects.toThrow('Holidays error');
      expect(ErrorHandler.handle).toHaveBeenCalledTimes(2);
    });
  });

  describe('patches persistence', () => {
    it('should invoke get_patches and return list when getAll is called', async () => {
      // Arrange
      const mockPatches = [aPatchLog({ id: 'pat_1' })];
      mockInvoke.mockResolvedValue(mockPatches);

      // Act
      const result = await commands.patches.getAll();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_patches');
      expect(result).toEqual(mockPatches);
    });

    it('should invoke save_patches with payload when save is called', async () => {
      // Arrange
      const mockPatches = [aPatchLog({ id: 'pat_1' })];
      mockInvoke.mockResolvedValue(undefined);

      // Act
      await commands.patches.save(mockPatches);

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('save_patches', { patches: mockPatches });
    });

    it('should report exception and rethrow when patches invocation fails', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('Patches error'));

      // Act & Assert
      await expect(commands.patches.getAll()).rejects.toThrow('Patches error');
      await expect(commands.patches.save([])).rejects.toThrow('Patches error');
      expect(ErrorHandler.handle).toHaveBeenCalledTimes(2);
    });
  });

  describe('uiState persistence', () => {
    it('should invoke get_current_project_id and save_current_project_id correctly', async () => {
      // Arrange
      mockInvoke.mockResolvedValueOnce('proj_1');
      mockInvoke.mockResolvedValueOnce(undefined);

      // Act
      const id = await commands.uiState.getCurrentProjectId();
      await commands.uiState.saveCurrentProjectId('proj_2');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_current_project_id');
      expect(id).toBe('proj_1');
      expect(mockInvoke).toHaveBeenCalledWith('save_current_project_id', { id: 'proj_2' });
    });

    it('should invoke last_non_compact_variant commands correctly', async () => {
      // Arrange
      mockInvoke.mockResolvedValueOnce('mini');
      mockInvoke.mockResolvedValueOnce(undefined);

      // Act
      const variant = await commands.uiState.getLastNonCompactVariant();
      await commands.uiState.saveLastNonCompactVariant('full');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_last_non_compact_variant');
      expect(variant).toBe('mini');
      expect(mockInvoke).toHaveBeenCalledWith('save_last_non_compact_variant', { variant: 'full' });
    });

    it('should fallback to default variant when get_last_non_compact_variant returns empty string', async () => {
      // Arrange
      mockInvoke.mockResolvedValueOnce('');

      // Act
      const variant = await commands.uiState.getLastNonCompactVariant();

      // Assert
      expect(variant).toBe('full');
    });

    it('should report exception and rethrow when uiState invocation fails', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('UI state error'));

      // Act & Assert
      await expect(commands.uiState.getCurrentProjectId()).rejects.toThrow('UI state error');
      await expect(commands.uiState.saveCurrentProjectId('p1')).rejects.toThrow('UI state error');
      await expect(commands.uiState.getLastNonCompactVariant()).rejects.toThrow('UI state error');
      await expect(commands.uiState.saveLastNonCompactVariant('full')).rejects.toThrow('UI state error');
      expect(ErrorHandler.handle).toHaveBeenCalledTimes(4);
    });
  });

  describe('externalApi persistence', () => {
    it('should invoke get_external_api_settings and return settings', async () => {
      // Arrange
      const mockSettings = {
        logToApi: true,
        apiToken: 'tok_123',
        apiUrl: 'https://api.test',
        apiMethod: 'POST' as const,
        apiHeaders: '',
      };
      mockInvoke.mockResolvedValue(mockSettings);

      // Act
      const result = await commands.externalApi.getSettings();

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_external_api_settings');
      expect(result).toEqual(mockSettings);
    });

    it('should invoke save_external_api_settings with settings payload', async () => {
      // Arrange
      const mockSettings = {
        logToApi: false,
        apiToken: '',
        apiUrl: '',
        apiMethod: 'POST' as const,
        apiHeaders: '',
      };
      mockInvoke.mockResolvedValue(undefined);

      // Act
      await commands.externalApi.saveSettings(mockSettings);

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('save_external_api_settings', { settings: mockSettings });
    });

    it('should report exception and rethrow when externalApi invocation fails', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('API settings error'));

      // Act & Assert
      await expect(commands.externalApi.getSettings()).rejects.toThrow('API settings error');
      await expect(commands.externalApi.saveSettings({} as never)).rejects.toThrow('API settings error');
      expect(ErrorHandler.handle).toHaveBeenCalledTimes(2);
    });
  });

  describe('locale persistence', () => {
    it('should invoke locale and preference commands correctly', async () => {
      // Arrange
      mockInvoke.mockResolvedValueOnce('pl');
      mockInvoke.mockResolvedValueOnce(undefined);
      mockInvoke.mockResolvedValueOnce('pl-PL');
      mockInvoke.mockResolvedValueOnce(undefined);

      // Act
      const pref = await commands.locale.getLocalePref();
      await commands.locale.saveLocalePref('en');
      const loc = await commands.locale.getLocale();
      await commands.locale.saveLocale('en-US');

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_locale_pref');
      expect(pref).toBe('pl');
      expect(mockInvoke).toHaveBeenCalledWith('save_locale_pref', { pref: 'en' });
      expect(mockInvoke).toHaveBeenCalledWith('get_locale');
      expect(loc).toBe('pl-PL');
      expect(mockInvoke).toHaveBeenCalledWith('save_locale', { locale: 'en-US' });
    });

    it('should parse and serialize custom translations correctly', async () => {
      // Arrange
      const translationsObj = { pl: { hello: 'cześć' } };
      mockInvoke.mockResolvedValueOnce(JSON.stringify(translationsObj));
      mockInvoke.mockResolvedValueOnce(undefined);

      // Act
      const fetched = await commands.locale.getCustomTranslations();
      await commands.locale.saveCustomTranslations(translationsObj);

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_custom_translations');
      expect(fetched).toEqual(translationsObj);
      expect(mockInvoke).toHaveBeenCalledWith('save_custom_translations', {
        translations: JSON.stringify(translationsObj),
      });
    });

    it('should return empty object when custom translations is empty or null', async () => {
      // Arrange
      mockInvoke.mockResolvedValueOnce('');

      // Act
      const fetched = await commands.locale.getCustomTranslations();

      // Assert
      expect(fetched).toEqual({});
    });

    it('should report exception and rethrow when locale invocation fails', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('Locale error'));

      // Act & Assert
      await expect(commands.locale.getLocalePref()).rejects.toThrow('Locale error');
      await expect(commands.locale.saveLocalePref('pl')).rejects.toThrow('Locale error');
      await expect(commands.locale.getLocale()).rejects.toThrow('Locale error');
      await expect(commands.locale.saveLocale('pl')).rejects.toThrow('Locale error');
      await expect(commands.locale.getCustomTranslations()).rejects.toThrow('Locale error');
      await expect(commands.locale.saveCustomTranslations({})).rejects.toThrow('Locale error');
      expect(ErrorHandler.handle).toHaveBeenCalledTimes(6);
    });
  });
});

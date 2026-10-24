import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import { ErrorHandler } from '@common/exceptions';

describe('Unit Tests: PersistenceCommands - System & UI', () => {
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

    it('should invoke get_project_order and save_project_order correctly', async () => {
      // Arrange
      mockInvoke.mockResolvedValueOnce(['p1', 'p2']);
      mockInvoke.mockResolvedValueOnce(undefined);

      // Act
      const order = await commands.uiState.getProjectOrder();
      await commands.uiState.saveProjectOrder(['p2', 'p1']);

      // Assert
      expect(mockInvoke).toHaveBeenCalledWith('get_project_order');
      expect(order).toEqual(['p1', 'p2']);
      expect(mockInvoke).toHaveBeenCalledWith('save_project_order', { order: ['p2', 'p1'] });
    });

    it('should report exception and rethrow when uiState invocation fails', async () => {
      // Arrange
      mockInvoke.mockRejectedValue(new Error('UI state error'));

      // Act & Assert
      await expect(commands.uiState.getCurrentProjectId()).rejects.toThrow('UI state error');
      await expect(commands.uiState.saveCurrentProjectId('p1')).rejects.toThrow('UI state error');
      await expect(commands.uiState.getLastNonCompactVariant()).rejects.toThrow('UI state error');
      await expect(commands.uiState.saveLastNonCompactVariant('full')).rejects.toThrow('UI state error');
      await expect(commands.uiState.getProjectOrder()).rejects.toThrow('UI state error');
      await expect(commands.uiState.saveProjectOrder(['p1'])).rejects.toThrow('UI state error');
      expect(ErrorHandler.handle).toHaveBeenCalledTimes(6);
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

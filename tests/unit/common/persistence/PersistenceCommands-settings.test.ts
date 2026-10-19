import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from '@tests/shared/test-helpers';
import { PersistenceCommands } from '@common/persistence/PersistenceCommands';
import { ErrorHandler } from '@common/exceptions';

describe('Unit Tests: PersistenceCommands - Settings & Config', () => {
  let commands: PersistenceCommands;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(ErrorHandler, 'handle').mockImplementation(() => {});
    commands = new PersistenceCommands();
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
});

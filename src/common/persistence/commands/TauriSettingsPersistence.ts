import { invoke } from '@tauri-apps/api/core';
import { ISettingsPersistence } from '../IPersistence';
import { Settings } from '@bindings/Settings';
import { SettingsPersistenceCommand } from '@bindings/SettingsPersistenceCommand';
import { ErrorHandler, TauriInteropException } from '../../exceptions';

export class TauriSettingsPersistence implements ISettingsPersistence {
  async get(): Promise<Settings> {
    try {
      const cmd: SettingsPersistenceCommand = 'get';
      return await invoke<Settings>(cmd);
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get settings via Tauri', err, 'ERR_TAURI_SETTINGS_GET'));
      throw err;
    }
  }

  async save(settings: Settings): Promise<void> {
    try {
      const cmd: SettingsPersistenceCommand = 'save';
      await invoke(cmd, { settings });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save settings via Tauri', err, 'ERR_TAURI_SETTINGS_SAVE'));
      throw err;
    }
  }
}

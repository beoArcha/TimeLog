import { invoke } from '@tauri-apps/api/core';
import { IExternalApiPersistence } from '../IPersistence';
import { ExternalApiSettings } from '@bindings/ExternalApiSettings';
import { ErrorHandler, TauriInteropException } from '../../exceptions';

export class TauriExternalApiPersistence implements IExternalApiPersistence {
  async getSettings(): Promise<ExternalApiSettings> {
    try {
      return await invoke<ExternalApiSettings>('get_external_api_settings');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get external api settings via Tauri', err, 'ERR_TAURI_API_SETTINGS_GET'));
      throw err;
    }
  }

  async saveSettings(settings: ExternalApiSettings): Promise<void> {
    try {
      await invoke('save_external_api_settings', { settings });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save external api settings via Tauri', err, 'ERR_TAURI_API_SETTINGS_SAVE'));
      throw err;
    }
  }
}

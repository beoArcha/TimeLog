import { invoke } from '@tauri-apps/api/core';
import { ILocalePersistence } from '../IPersistence';
import { ErrorHandler, TauriInteropException } from '../../exceptions';

export class TauriLocalePersistence implements ILocalePersistence {
  async getLocalePref(): Promise<string> {
    try {
      const pref = await invoke<string>('get_locale_pref');
      return pref || 'system';
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get locale preference via Tauri', err, 'ERR_TAURI_LOCALE_PREF_GET'));
      throw err;
    }
  }

  async saveLocalePref(pref: string): Promise<void> {
    try {
      await invoke('save_locale_pref', { pref });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save locale preference via Tauri', err, 'ERR_TAURI_LOCALE_PREF_SAVE'));
      throw err;
    }
  }

  async getLocale(): Promise<string> {
    try {
      const loc = await invoke<string>('get_locale');
      return loc || 'system';
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get locale via Tauri', err, 'ERR_TAURI_LOCALE_GET'));
      throw err;
    }
  }

  async saveLocale(locale: string): Promise<void> {
    try {
      await invoke('save_locale', { locale });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save locale via Tauri', err, 'ERR_TAURI_LOCALE_SAVE'));
      throw err;
    }
  }

  async getCustomTranslations(): Promise<Record<string, Record<string, string>>> {
    try {
      const raw = await invoke<string>('get_custom_translations');
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get custom translations via Tauri', err, 'ERR_TAURI_CUSTOM_TRANS_GET'));
      throw err;
    }
  }

  async saveCustomTranslations(translations: Record<string, Record<string, string>>): Promise<void> {
    try {
      await invoke('save_custom_translations', { translations: JSON.stringify(translations) });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save custom translations via Tauri', err, 'ERR_TAURI_CUSTOM_TRANS_SAVE'));
      throw err;
    }
  }
}

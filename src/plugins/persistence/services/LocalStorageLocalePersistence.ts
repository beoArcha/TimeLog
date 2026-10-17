import { ILocalePersistence } from '@common/persistence/IPersistence';
import { STORAGE_KEYS } from '@common/constants/storage-keys';

export class LocalStorageLocalePersistence implements ILocalePersistence {
  async getLocalePref(): Promise<string> {
    return localStorage.getItem(STORAGE_KEYS.LOCALE_PREF) || 'system';
  }

  async saveLocalePref(pref: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.LOCALE_PREF, pref);
  }

  async getLocale(): Promise<string> {
    return localStorage.getItem(STORAGE_KEYS.LOCALE) || 'system';
  }

  async saveLocale(loc: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.LOCALE, loc);
  }

  async getCustomTranslations(): Promise<Record<string, Record<string, string>>> {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  }

  async saveCustomTranslations(translations: Record<string, Record<string, string>>): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS, JSON.stringify(translations));
  }
}

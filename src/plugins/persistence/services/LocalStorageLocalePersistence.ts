import { ILocalePersistence } from '@common/persistence/IPersistence';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
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
      } catch (e) {
        ErrorHandler.handle(
          new PersistenceException(
            'Failed to parse custom translations from LocalStorage',
            e,
            'WARN_PERSISTENCE_TRANSLATIONS_PARSE',
            'WARN'
          )
        );
        return {};
      }
    }
    return {};
  }

  async saveCustomTranslations(translations: Record<string, Record<string, string>>): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS, JSON.stringify(translations));
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException(
          'Failed to save custom translations to LocalStorage',
          e,
          'ERR_PERSISTENCE_TRANSLATIONS_SAVE'
        )
      );
      throw e;
    }
  }
}

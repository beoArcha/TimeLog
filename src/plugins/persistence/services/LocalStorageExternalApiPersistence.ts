import { IExternalApiPersistence } from '@common/persistence/IPersistence';
import { ExternalApiSettings } from '@bindings/ExternalApiSettings';
import { STORAGE_KEYS } from '@common/constants/storage-keys';
import { safeStorageGetItem, safeStorageSetItem } from '@common/utils/safeLocalStorage';

export class LocalStorageExternalApiPersistence implements IExternalApiPersistence {
  async getSettings(): Promise<ExternalApiSettings> {
    return {
      logToApi: safeStorageGetItem(STORAGE_KEYS.LOG_TO_API) === 'true',
      apiToken: safeStorageGetItem(STORAGE_KEYS.API_TOKEN) || '',
      apiUrl: safeStorageGetItem(STORAGE_KEYS.API_URL) || '',
      apiMethod: (safeStorageGetItem(STORAGE_KEYS.API_METHOD) as 'POST' | 'PUT') || 'POST',
      apiHeaders: safeStorageGetItem(STORAGE_KEYS.API_HEADERS) || '',
    };
  }

  async saveSettings(settings: ExternalApiSettings): Promise<void> {
    safeStorageSetItem(STORAGE_KEYS.LOG_TO_API, String(settings.logToApi));
    safeStorageSetItem(STORAGE_KEYS.API_TOKEN, settings.apiToken);
    safeStorageSetItem(STORAGE_KEYS.API_URL, settings.apiUrl);
    safeStorageSetItem(STORAGE_KEYS.API_METHOD, settings.apiMethod);
    safeStorageSetItem(STORAGE_KEYS.API_HEADERS, settings.apiHeaders);
  }
}

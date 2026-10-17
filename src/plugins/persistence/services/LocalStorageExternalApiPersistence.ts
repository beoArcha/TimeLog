import { IExternalApiPersistence } from '@common/persistence/IPersistence';
import { ExternalApiSettings } from '@bindings/ExternalApiSettings';
import { STORAGE_KEYS } from '@common/constants/storage-keys';

export class LocalStorageExternalApiPersistence implements IExternalApiPersistence {
  async getSettings(): Promise<ExternalApiSettings> {
    return {
      logToApi: localStorage.getItem(STORAGE_KEYS.LOG_TO_API) === 'true',
      apiToken: localStorage.getItem(STORAGE_KEYS.API_TOKEN) || '',
      apiUrl: localStorage.getItem(STORAGE_KEYS.API_URL) || '',
      apiMethod: (localStorage.getItem(STORAGE_KEYS.API_METHOD) as 'POST' | 'PUT') || 'POST',
      apiHeaders: localStorage.getItem(STORAGE_KEYS.API_HEADERS) || '',
    };
  }

  async saveSettings(settings: ExternalApiSettings): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.LOG_TO_API, String(settings.logToApi));
    localStorage.setItem(STORAGE_KEYS.API_TOKEN, settings.apiToken);
    localStorage.setItem(STORAGE_KEYS.API_URL, settings.apiUrl);
    localStorage.setItem(STORAGE_KEYS.API_METHOD, settings.apiMethod);
    localStorage.setItem(STORAGE_KEYS.API_HEADERS, settings.apiHeaders);
  }
}

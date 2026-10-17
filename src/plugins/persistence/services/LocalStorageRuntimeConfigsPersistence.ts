import { IRuntimeConfigPersistence } from '@common/persistence/IPersistence';
import { RuntimeConfig } from '@bindings/RuntimeConfig';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { STORAGE_KEYS } from '@common/constants/storage-keys';

export class LocalStorageRuntimeConfigsPersistence implements IRuntimeConfigPersistence {
  async save(config: RuntimeConfig): Promise<void> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RUN_CONFIGS_KEY);
      const list: RuntimeConfig[] = data ? JSON.parse(data) : [];
      const idx = list.findIndex((c) => c.id === config.id);
      if (idx !== -1) {
        list[idx] = config;
      } else {
        list.push(config);
      }
      localStorage.setItem(STORAGE_KEYS.RUN_CONFIGS_KEY, JSON.stringify(list));
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException('Failed to save runtime config to LocalStorage', e, 'ERR_PERSISTENCE_RUN_CONFIG_SAVE')
      );
      throw e;
    }
  }

  async getAll(): Promise<RuntimeConfig[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RUN_CONFIGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException('Failed to get runtime configs from LocalStorage', e, 'ERR_PERSISTENCE_RUN_CONFIG_GET')
      );
      return [];
    }
  }
}

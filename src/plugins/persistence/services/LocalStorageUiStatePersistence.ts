import { IUiStatePersistence } from '@common/persistence/IPersistence';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { STORAGE_KEYS } from '@common/constants/storage-keys';

export class LocalStorageUiStatePersistence implements IUiStatePersistence {
  async getCurrentProjectId(): Promise<string | null> {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJ_ID);
  }

  async saveCurrentProjectId(id: string | null): Promise<void> {
    if (id === null) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJ_ID);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PROJ_ID, id);
    }
  }

  async getLastNonCompactVariant(): Promise<string> {
    return localStorage.getItem(STORAGE_KEYS.LAST_NON_COMPACT_VARIANT) || 'full';
  }

  async saveLastNonCompactVariant(variant: string): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.LAST_NON_COMPACT_VARIANT, variant);
  }

  async getProjectOrder(): Promise<string[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECT_ORDER);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
      return [];
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException(
          'Failed to parse project order from LocalStorage',
          e,
          'WARN_PERSISTENCE_PROJECT_ORDER_PARSE',
          'WARN'
        )
      );
      return [];
    }
  }

  async saveProjectOrder(order: string[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECT_ORDER, JSON.stringify(order));
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException(
          'Failed to save project order to LocalStorage',
          e,
          'ERR_PERSISTENCE_PROJECT_ORDER_SAVE'
        )
      );
      throw e;
    }
  }

  async getLastTrackedTaskId(): Promise<string | null> {
    return localStorage.getItem(STORAGE_KEYS.LAST_TRACKED_TASK_ID);
  }

  async saveLastTrackedTaskId(id: string | null): Promise<void> {
    if (id === null) {
      localStorage.removeItem(STORAGE_KEYS.LAST_TRACKED_TASK_ID);
    } else {
      localStorage.setItem(STORAGE_KEYS.LAST_TRACKED_TASK_ID, id);
    }
  }
}

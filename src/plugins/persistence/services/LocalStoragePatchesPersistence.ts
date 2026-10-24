import { IPatchesPersistence } from '@common/persistence/IPersistence';
import { PatchLog } from '@bindings/PatchLog';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { STORAGE_KEYS } from '@common/constants/storage-keys';

export class LocalStoragePatchesPersistence implements IPatchesPersistence {
  async getAll(): Promise<PatchLog[]> {
    const data = localStorage.getItem(STORAGE_KEYS.PATCHES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException(
          'Failed to parse patches from LocalStorage',
          e,
          'WARN_PERSISTENCE_PATCHES_PARSE',
          'WARN'
        )
      );
      return [];
    }
  }

  async save(patches: PatchLog[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEYS.PATCHES, JSON.stringify(patches));
    } catch (e) {
      ErrorHandler.handle(
        new PersistenceException(
          'Failed to save patches to LocalStorage',
          e,
          'ERR_PERSISTENCE_PATCHES_SAVE'
        )
      );
      throw e;
    }
  }
}

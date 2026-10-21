import { IPatchesPersistence } from '@common/persistence/IPersistence';
import { PatchLog } from '@bindings/PatchLog';
import { STORAGE_KEYS } from '@common/constants/storage-keys';

export class LocalStoragePatchesPersistence implements IPatchesPersistence {
  async getAll(): Promise<PatchLog[]> {
    const data = localStorage.getItem(STORAGE_KEYS.PATCHES);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  async save(patches: PatchLog[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.PATCHES, JSON.stringify(patches));
  }
}

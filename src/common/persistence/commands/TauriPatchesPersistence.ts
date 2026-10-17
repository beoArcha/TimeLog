import { invoke } from '@tauri-apps/api/core';
import { IPatchesPersistence } from '../IPersistence';
import { PatchLog } from '@bindings/PatchLog';
import { ErrorHandler, TauriInteropException } from '../../exceptions';

export class TauriPatchesPersistence implements IPatchesPersistence {
  async getAll(): Promise<PatchLog[]> {
    try {
      return await invoke<PatchLog[]>('get_patches');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get patches via Tauri', err, 'ERR_TAURI_PATCHES_GET'));
      throw err;
    }
  }

  async save(patches: PatchLog[]): Promise<void> {
    try {
      await invoke('save_patches', { patches });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save patches via Tauri', err, 'ERR_TAURI_PATCHES_SAVE'));
      throw err;
    }
  }
}

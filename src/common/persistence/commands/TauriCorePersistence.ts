import { invoke } from '@tauri-apps/api/core';
import { ICorePersistence } from '../IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { CorePersistenceCommand } from '@bindings/CorePersistenceCommand';
import { StorageDomain, StorageResetScope } from '@common/constants/storage-keys';
import { ErrorHandler, TauriInteropException } from '../../exceptions';

export class TauriCorePersistence implements ICorePersistence {
  async load(): Promise<TimerRepositoryState | null> {
    try {
      const cmd: CorePersistenceCommand = 'get_state';
      const state = await invoke<TimerRepositoryState>(cmd);
      if (!state || !Array.isArray(state.projects) || !Array.isArray(state.tasks)) {
        return null;
      }
      if (state.projects.length === 0 && state.tasks.length === 0) {
        return null;
      }
      return state;
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to load state from SQLite via Tauri', err, 'ERR_TAURI_SQLITE_LOAD'));
      throw err;
    }
  }

  async overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    try {
      await invoke('override_state', { state });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('override_state command not supported by backend', err, 'WARN_TAURI_OVERRIDE'));
    }
    const currentState = await this.load();
    return currentState || { projects: [], tasks: [], logs: [], activeLog: null };
  }

  async reset(_scope?: StorageResetScope | StorageDomain[]): Promise<TimerRepositoryState> {
    const cmd: CorePersistenceCommand = 'reset';
    return invoke<TimerRepositoryState>(cmd);
  }
}

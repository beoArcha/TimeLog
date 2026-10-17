import { invoke } from '@tauri-apps/api/core';
import { IRuntimeConfigPersistence } from '../IPersistence';
import { RuntimeConfig } from '@bindings/RuntimeConfig';
import { ErrorHandler, TauriInteropException } from '../../exceptions';

export class TauriRuntimeConfigsPersistence implements IRuntimeConfigPersistence {
  async save(config: RuntimeConfig): Promise<void> {
    try {
      const cmd = 'save_runtime_config';
      await invoke(cmd, { config });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save runtime config via Tauri', err, 'ERR_TAURI_RUN_CONFIG_SAVE'));
      throw err;
    }
  }

  async getAll(): Promise<RuntimeConfig[]> {
    try {
      const cmd = 'get_runtime_configs';
      return await invoke<RuntimeConfig[]>(cmd);
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get runtime configs via Tauri', err, 'ERR_TAURI_RUN_CONFIG_GET'));
      throw err;
    }
  }
}

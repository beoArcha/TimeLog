import { invoke } from '@tauri-apps/api/core';
import { IUiStatePersistence } from '../IPersistence';
import { ErrorHandler, TauriInteropException } from '../../exceptions';

export class TauriUiStatePersistence implements IUiStatePersistence {
  async getCurrentProjectId(): Promise<string | null> {
    try {
      return await invoke<string | null>('get_current_project_id');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get current project id via Tauri', err, 'ERR_TAURI_UI_PROJ_GET'));
      throw err;
    }
  }

  async saveCurrentProjectId(id: string | null): Promise<void> {
    try {
      await invoke('save_current_project_id', { id });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save current project id via Tauri', err, 'ERR_TAURI_UI_PROJ_SAVE'));
      throw err;
    }
  }

  async getLastNonCompactVariant(): Promise<string> {
    try {
      const variant = await invoke<string>('get_last_non_compact_variant');
      return variant || 'full';
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get last non compact variant via Tauri', err, 'ERR_TAURI_UI_VARIANT_GET'));
      throw err;
    }
  }

  async saveLastNonCompactVariant(variant: string): Promise<void> {
    try {
      await invoke('save_last_non_compact_variant', { variant });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save last non compact variant via Tauri', err, 'ERR_TAURI_UI_VARIANT_SAVE'));
      throw err;
    }
  }

  async getProjectOrder(): Promise<string[]> {
    try {
      const order = await invoke<string[]>('get_project_order');
      return order || [];
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get project order via Tauri', err, 'ERR_TAURI_UI_PROJ_ORDER_GET'));
      throw err;
    }
  }

  async saveProjectOrder(order: string[]): Promise<void> {
    try {
      await invoke('save_project_order', { order });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save project order via Tauri', err, 'ERR_TAURI_UI_PROJ_ORDER_SAVE'));
      throw err;
    }
  }

  async getLastTrackedTaskId(): Promise<string | null> {
    try {
      return await invoke<string | null>('get_last_tracked_task_id');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get last tracked task id via Tauri', err, 'ERR_TAURI_UI_LAST_TASK_GET'));
      throw err;
    }
  }

  async saveLastTrackedTaskId(id: string | null): Promise<void> {
    try {
      await invoke('save_last_tracked_task_id', { id });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save last tracked task id via Tauri', err, 'ERR_TAURI_UI_LAST_TASK_SAVE'));
      throw err;
    }
  }
}

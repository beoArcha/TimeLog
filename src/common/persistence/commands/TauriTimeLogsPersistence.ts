import { invoke } from '@tauri-apps/api/core';
import { ITimeLogsPersistence } from '../IPersistence';
import { TimeLog } from '@bindings/TimeLog';
import { ErrorHandler, TauriInteropException } from '../../exceptions';

export class TauriTimeLogsPersistence implements ITimeLogsPersistence {
  async getForTask(taskId: string): Promise<TimeLog[]> {
    return invoke<TimeLog[]>('get_for_task', { taskId });
  }

  async closeActiveByProject(endTime: string, projectId: string): Promise<void> {
    await invoke('close_active_by_project', { endTime, projectId });
  }

  async closeAllActive(endTime: string): Promise<void> {
    await invoke('close_all_active', { endTime });
  }

  async insert(logId: string, taskId: string, startTime: string): Promise<void> {
    await invoke('insert', { logId, taskId, startTime });
  }

  async queryActive(): Promise<string[]> {
    return invoke<string[]>('query_active');
  }

  async getAll(): Promise<TimeLog[]> {
    return invoke<TimeLog[]>('get_all');
  }

  async delete(logId: string): Promise<void> {
    try {
      await invoke('delete_time_log', { logId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to delete time log via Tauri', err, 'ERR_TAURI_TIMELOG_DELETE'));
      throw err;
    }
  }
}

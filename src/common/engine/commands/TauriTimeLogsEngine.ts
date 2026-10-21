import { invoke } from '@tauri-apps/api/core';
import { ITimeLogsEngine } from '../IEngine';
import { ErrorHandler, TauriInteropException } from '@common/exceptions';

export class TauriTimeLogsEngine implements ITimeLogsEngine {
  async editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void> {
    try {
      await invoke('edit_time_log', { id, taskId, startTime, endTime, note, reason });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to edit time log via Tauri', err, 'ERR_TAURI_ENGINE_EDIT'));
      throw err;
    }
  }
}

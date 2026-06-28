import { invoke } from '@tauri-apps/api/core';
import { IEngine } from './IEngine';
import { ErrorHandler, TauriInteropException } from '../exceptions';

export class EngineCommands implements IEngine {
  async startTimer(taskId: string): Promise<void> {
    try {
      await invoke('start_timer', { taskId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to start timer via Tauri', err, 'ERR_TAURI_ENGINE_START'));
      throw err;
    }
  }

  async stopTimer(projectId?: string): Promise<void> {
    try {
      await invoke('stop_timer', { projectId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to stop timer via Tauri', err, 'ERR_TAURI_ENGINE_STOP'));
      throw err;
    }
  }
}

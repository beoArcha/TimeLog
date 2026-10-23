import { invoke } from '@tauri-apps/api/core';
import { ITimerEngine } from '../IEngine';
import { ErrorHandler, TauriInteropException } from '@common/exceptions';

export class TauriTimerEngine implements ITimerEngine {
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

  async resumeTimer(taskId: string): Promise<void> {
    try {
      await invoke('resume_timer', { taskId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to resume timer via Tauri', err, 'ERR_TAURI_ENGINE_RESUME'));
      throw err;
    }
  }

  async switchTimer(taskId: string): Promise<void> {
    try {
      await invoke('switch_timer', { taskId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to switch timer via Tauri', err, 'ERR_TAURI_ENGINE_SWITCH'));
      throw err;
    }
  }

  async getActiveLogs(): Promise<string[]> {
    try {
      return await invoke<string[]>('get_active_logs');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get active logs via Tauri', err, 'ERR_TAURI_ENGINE_ACTIVE_LOGS'));
      throw err;
    }
  }
}

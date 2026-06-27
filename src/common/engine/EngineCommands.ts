import { invoke } from '@tauri-apps/api/core';
import { IEngine } from './IEngine';

export class EngineCommands implements IEngine {
  async startTimer(taskId: string): Promise<void> {
    try {
      await invoke('start_timer', { taskId });
    } catch (err) {
      console.error('Failed to start timer via Tauri:', err);
      throw err;
    }
  }

  async stopTimer(projectId?: string): Promise<void> {
    try {
      await invoke('stop_timer', { projectId });
    } catch (err) {
      console.error('Failed to stop timer via Tauri:', err);
      throw err;
    }
  }
}

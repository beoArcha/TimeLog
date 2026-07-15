import { invoke } from '@tauri-apps/api/core';
import { IEngine } from './IEngine';
import { ErrorHandler, TauriInteropException } from '../exceptions';
import { EngineCommand } from '@bindings/EngineCommand';
import { ProjectStatistics } from '@bindings/ProjectStatistics';

export class EngineCommands implements IEngine {
  async startTimer(taskId: string): Promise<void> {
    try {
      const cmd: EngineCommand = 'start_timer';
      await invoke(cmd, { taskId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to start timer via Tauri', err, 'ERR_TAURI_ENGINE_START'));
      throw err;
    }
  }

  async stopTimer(projectId?: string): Promise<void> {
    try {
      const cmd: EngineCommand = 'stop_timer';
      await invoke(cmd, { projectId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to stop timer via Tauri', err, 'ERR_TAURI_ENGINE_STOP'));
      throw err;
    }
  }

  async editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void> {
    try {
      const cmd: EngineCommand = 'edit_time_log';
      await invoke(cmd, { id, taskId, startTime, endTime, note, reason });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to edit time log via Tauri', err, 'ERR_TAURI_ENGINE_EDIT'));
      throw err;
    }
  }

  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    try {
      const cmd: EngineCommand = 'get_project_statistics';
      return await invoke(cmd, { projectId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get project statistics via Tauri', err, 'ERR_TAURI_ENGINE_STATS'));
      throw err;
    }
  }
}


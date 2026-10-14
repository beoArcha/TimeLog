import { invoke } from '@tauri-apps/api/core';
import { IEngine } from './IEngine';
import { ErrorHandler, TauriInteropException } from '../exceptions';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { ElapsedRangeFilter } from '@bindings/ElapsedRangeFilter';

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

  async resumeTimer(taskId: string): Promise<void> {
    try {
      await invoke('resume_timer', { taskId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to resume timer via Tauri', err, 'ERR_TAURI_ENGINE_RESUME'));
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

  async getComputedMetrics(nowIso?: string): Promise<EngineComputedMetrics> {
    try {
      return await invoke<EngineComputedMetrics>('get_computed_metrics', { nowIso });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get computed metrics via Tauri', err, 'ERR_TAURI_ENGINE_COMPUTED_METRICS'));
      throw err;
    }
  }

  async getTaskElapsed(taskId: string, nowIso?: string): Promise<number> {
    try {
      return await invoke<number>('get_task_elapsed', { taskId, nowIso });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get task elapsed via Tauri', err, 'ERR_TAURI_ENGINE_TASK_ELAPSED'));
      throw err;
    }
  }

  async getProjectElapsed(projectId: string, nowIso?: string): Promise<number> {
    try {
      return await invoke<number>('get_project_elapsed', { projectId, nowIso });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get project elapsed via Tauri', err, 'ERR_TAURI_ENGINE_PROJ_ELAPSED'));
      throw err;
    }
  }

  async getElapsedRange(range: ElapsedRangeFilter, nowIso?: string): Promise<number> {
    try {
      return await invoke<number>('get_elapsed_range', { range, nowIso });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get elapsed range via Tauri', err, 'ERR_TAURI_ENGINE_RANGE_ELAPSED'));
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
      await invoke('edit_time_log', { id, taskId, startTime, endTime, note, reason });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to edit time log via Tauri', err, 'ERR_TAURI_ENGINE_EDIT'));
      throw err;
    }
  }

  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    try {
      return await invoke<ProjectStatistics>('get_project_statistics', { projectId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get project statistics via Tauri', err, 'ERR_TAURI_ENGINE_STATS'));
      throw err;
    }
  }
}

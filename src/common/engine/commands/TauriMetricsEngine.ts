import { invoke } from '@tauri-apps/api/core';
import { IMetricsEngine, EngineComputedMetrics, ElapsedRangeFilter, RangeMetricsResult } from '../IEngine';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { ErrorHandler, TauriInteropException } from '@common/exceptions';

export class TauriMetricsEngine implements IMetricsEngine {
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

  async getRangeMetrics(range: ElapsedRangeFilter, nowIso?: string): Promise<RangeMetricsResult> {
    try {
      return await invoke<RangeMetricsResult>('get_range_metrics', { range, nowIso });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get range metrics via Tauri', err, 'ERR_TAURI_ENGINE_RANGE_METRICS'));
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

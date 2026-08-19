import { invoke } from '@tauri-apps/api/core';
import { IEngine, CreateProjectInput, CreateTaskInput } from './IEngine';
import { ErrorHandler, TauriInteropException } from '../exceptions';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { TaskStatus } from '@bindings/TaskStatus';
import { Settings } from '@bindings/Settings';
import { RuntimeConfig } from '@bindings/RuntimeConfig';
import { ElapsedRangeFilter } from '../../plugins/engine/elapsed';

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

  async addProject(input: CreateProjectInput): Promise<TimerRepositoryState> {
    try {
      return await invoke<TimerRepositoryState>('add_project', {
        name: input.name,
        color: input.color,
        description: input.description ?? null,
        icon: input.icon ?? null,
        tags: input.tags ?? null,
      });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to add project via Tauri', err, 'ERR_TAURI_ENGINE_ADD_PROJ'));
      throw err;
    }
  }

  async updateProject(
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ): Promise<TimerRepositoryState> {
    try {
      return await invoke<TimerRepositoryState>('update_project', {
        projectId,
        name,
        color,
        description,
        icon,
        tags,
      });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to update project via Tauri', err, 'ERR_TAURI_ENGINE_UPDATE_PROJ'));
      throw err;
    }
  }

  async renameProject(projectId: string, name: string): Promise<TimerRepositoryState> {
    try {
      return await invoke<TimerRepositoryState>('rename_project', { projectId, name });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to rename project via Tauri', err, 'ERR_TAURI_ENGINE_RENAME_PROJ'));
      throw err;
    }
  }

  async toggleProjectArchive(projectId: string): Promise<TimerRepositoryState> {
    try {
      return await invoke<TimerRepositoryState>('toggle_project_archive', { projectId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to toggle project archive via Tauri', err, 'ERR_TAURI_ENGINE_ARCHIVE_PROJ'));
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

  async addTask(input: CreateTaskInput): Promise<TimerRepositoryState> {
    try {
      return await invoke<TimerRepositoryState>('add_task', {
        projectId: input.projectId,
        name: input.name,
        parentTaskId: input.parentTaskId ?? null,
      });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to add task via Tauri', err, 'ERR_TAURI_ENGINE_ADD_TASK'));
      throw err;
    }
  }

  async updateTask(
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ): Promise<TimerRepositoryState> {
    try {
      return await invoke<TimerRepositoryState>('update_task', {
        taskId,
        name,
        parentTaskId,
        status,
        completed,
      });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to update task via Tauri', err, 'ERR_TAURI_ENGINE_UPDATE_TASK'));
      throw err;
    }
  }

  async renameTask(taskId: string, name: string): Promise<TimerRepositoryState> {
    try {
      return await invoke<TimerRepositoryState>('rename_task', { taskId, name });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to rename task via Tauri', err, 'ERR_TAURI_ENGINE_RENAME_TASK'));
      throw err;
    }
  }

  async deleteTask(taskId: string): Promise<TimerRepositoryState> {
    try {
      return await invoke<TimerRepositoryState>('delete_task', { taskId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to delete task via Tauri', err, 'ERR_TAURI_ENGINE_DELETE_TASK'));
      throw err;
    }
  }

  async toggleTaskComplete(taskId: string): Promise<TimerRepositoryState> {
    try {
      return await invoke<TimerRepositoryState>('toggle_task_complete', { taskId });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to toggle task complete via Tauri', err, 'ERR_TAURI_ENGINE_COMPLETE_TASK'));
      throw err;
    }
  }

  async getSettings(): Promise<Settings> {
    try {
      return await invoke<Settings>('get_settings');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get settings via Tauri', err, 'ERR_TAURI_ENGINE_GET_SETTINGS'));
      throw err;
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    try {
      await invoke('save_settings', { settings });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save settings via Tauri', err, 'ERR_TAURI_ENGINE_SAVE_SETTINGS'));
      throw err;
    }
  }

  async getRuntimeConfigs(): Promise<RuntimeConfig[]> {
    try {
      return await invoke<RuntimeConfig[]>('get_runtime_configs');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get runtime configs via Tauri', err, 'ERR_TAURI_ENGINE_GET_CONFIGS'));
      throw err;
    }
  }

  async saveRuntimeConfig(config: RuntimeConfig): Promise<void> {
    try {
      await invoke('save_runtime_config', { config });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save runtime config via Tauri', err, 'ERR_TAURI_ENGINE_SAVE_CONFIG'));
      throw err;
    }
  }

  async getState(): Promise<TimerRepositoryState | null> {
    try {
      return await invoke<TimerRepositoryState | null>('get_state');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get state via Tauri', err, 'ERR_TAURI_ENGINE_GET_STATE'));
      throw err;
    }
  }

  async resetState(): Promise<TimerRepositoryState> {
    try {
      return await invoke<TimerRepositoryState>('reset');
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to reset state via Tauri', err, 'ERR_TAURI_ENGINE_RESET_STATE'));
      throw err;
    }
  }
}

import { invoke } from '@tauri-apps/api/core';
import { IPersistence } from './IPersistence';
import { ErrorHandler, TauriInteropException } from '../exceptions';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { PersistenceCommand } from '@bindings/PersistenceCommand';
import { Settings } from '@bindings/Settings';

export class PersistenceCommands implements IPersistence {
  async load(): Promise<TimerRepositoryState | null> {
    try {
      const cmd: PersistenceCommand = 'get_timer_state';
      const state = await invoke<TimerRepositoryState>(cmd);
      if (state.projects.length === 0 && state.tasks.length === 0) {
        return null;
      }
      return state;
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to load state from SQLite via Tauri', err, 'ERR_TAURI_SQLITE_LOAD'));
      throw err;
    }
  }

  async overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    try {
      await invoke('override_state' as any, { state });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('override_state command not supported by backend', err, 'WARN_TAURI_OVERRIDE'));
    }
    const currentState = await this.load();
    return currentState || { projects: [], tasks: [], logs: [], activeLog: null };
  }

  async addProject(input: { name: string; color: string }): Promise<TimerRepositoryState> {
    const cmd: PersistenceCommand = 'add_project';
    return invoke<TimerRepositoryState>(cmd, { name: input.name, color: input.color });
  }

  async toggleProjectArchive(projectId: string): Promise<TimerRepositoryState> {
    const cmd: PersistenceCommand = 'toggle_project_archive';
    return invoke<TimerRepositoryState>(cmd, { projectId });
  }

  async addTask(input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState> {
    const cmd: PersistenceCommand = 'add_task';
    return invoke<TimerRepositoryState>(cmd, {
      projectId: input.projectId,
      name: input.name,
      parentTaskId: input.parentTaskId,
    });
  }

  async renameProject(projectId: string, name: string): Promise<TimerRepositoryState> {
    const cmd: PersistenceCommand = 'rename_project';
    return invoke<TimerRepositoryState>(cmd, { projectId, name });
  }

  async renameTask(taskId: string, name: string): Promise<TimerRepositoryState> {
    const cmd: PersistenceCommand = 'rename_task';
    return invoke<TimerRepositoryState>(cmd, { taskId, name });
  }

  async deleteTask(taskId: string): Promise<TimerRepositoryState> {
    const cmd: PersistenceCommand = 'delete_task';
    return invoke<TimerRepositoryState>(cmd, { taskId });
  }

  async toggleTaskComplete(taskId: string): Promise<TimerRepositoryState> {
    const cmd: PersistenceCommand = 'toggle_task_complete';
    return invoke<TimerRepositoryState>(cmd, { taskId });
  }

  async getSettings(): Promise<Settings> {
    try {
      const cmd: PersistenceCommand = 'get_settings';
      return await invoke<Settings>(cmd);
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to get settings via Tauri', err, 'ERR_TAURI_SETTINGS_GET'));
      throw err;
    }
  }

  async saveSettings(settings: Settings): Promise<void> {
    try {
      const cmd: PersistenceCommand = 'save_settings';
      await invoke(cmd, { settings });
    } catch (err) {
      ErrorHandler.handle(new TauriInteropException('Failed to save settings via Tauri', err, 'ERR_TAURI_SETTINGS_SAVE'));
      throw err;
    }
  }

  async reset(): Promise<TimerRepositoryState> {
    const cmd: PersistenceCommand = 'reset_database';
    return invoke<TimerRepositoryState>(cmd);
  }
}

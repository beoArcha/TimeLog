import { invoke } from '@tauri-apps/api/core';
import { IPersistence, ICorePersistence, IProjectsPersistence, ITasksPersistence, ISettingsPersistence } from './IPersistence';
import { ErrorHandler, TauriInteropException } from '../exceptions';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { CorePersistenceCommand } from '@bindings/CorePersistenceCommand';
import { ProjectsPersistenceCommand } from '@bindings/ProjectsPersistenceCommand';
import { TasksPersistenceCommand } from '@bindings/TasksPersistenceCommand';
import { SettingsPersistenceCommand } from '@bindings/SettingsPersistenceCommand';
import { Settings } from '@bindings/Settings';

export class PersistenceCommands implements IPersistence {
  public core: ICorePersistence;
  public projects: IProjectsPersistence;
  public tasks: ITasksPersistence;
  public settings: ISettingsPersistence;

  constructor() {
    this.core = {
      load: async (): Promise<TimerRepositoryState | null> => {
        try {
          const cmd: CorePersistenceCommand = 'get_timer_state';
          const state = await invoke<TimerRepositoryState>(cmd);
          if (state.projects.length === 0 && state.tasks.length === 0) {
            return null;
          }
          return state;
        } catch (err) {
          ErrorHandler.handle(new TauriInteropException('Failed to load state from SQLite via Tauri', err, 'ERR_TAURI_SQLITE_LOAD'));
          throw err;
        }
      },

      overrideState: async (state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> => {
        try {
          await invoke('override_state' as any, { state });
        } catch (err) {
          ErrorHandler.handle(new TauriInteropException('override_state command not supported by backend', err, 'WARN_TAURI_OVERRIDE'));
        }
        const currentState = await this.core.load();
        return currentState || { projects: [], tasks: [], logs: [], activeLog: null };
      },

      reset: async (): Promise<TimerRepositoryState> => {
        const cmd: CorePersistenceCommand = 'reset_database';
        return invoke<TimerRepositoryState>(cmd);
      }
    };

    this.projects = {
      add: async (input: { name: string; color: string }): Promise<TimerRepositoryState> => {
        const cmd: ProjectsPersistenceCommand = 'add_project';
        return invoke<TimerRepositoryState>(cmd, { name: input.name, color: input.color });
      },

      toggleArchive: async (projectId: string): Promise<TimerRepositoryState> => {
        const cmd: ProjectsPersistenceCommand = 'toggle_project_archive';
        return invoke<TimerRepositoryState>(cmd, { projectId });
      },

      rename: async (projectId: string, name: string): Promise<TimerRepositoryState> => {
        const cmd: ProjectsPersistenceCommand = 'rename_project';
        return invoke<TimerRepositoryState>(cmd, { projectId, name });
      }
    };

    this.tasks = {
      add: async (input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState> => {
        const cmd: TasksPersistenceCommand = 'add_task';
        return invoke<TimerRepositoryState>(cmd, {
          projectId: input.projectId,
          name: input.name,
          parentTaskId: input.parentTaskId,
        });
      },

      rename: async (taskId: string, name: string): Promise<TimerRepositoryState> => {
        const cmd: TasksPersistenceCommand = 'rename_task';
        return invoke<TimerRepositoryState>(cmd, { taskId, name });
      },

      delete: async (taskId: string): Promise<TimerRepositoryState> => {
        const cmd: TasksPersistenceCommand = 'delete_task';
        return invoke<TimerRepositoryState>(cmd, { taskId });
      },

      toggleComplete: async (taskId: string): Promise<TimerRepositoryState> => {
        const cmd: TasksPersistenceCommand = 'toggle_task_complete';
        return invoke<TimerRepositoryState>(cmd, { taskId });
      }
    };

    this.settings = {
      get: async (): Promise<Settings> => {
        try {
          const cmd: SettingsPersistenceCommand = 'get_settings';
          return await invoke<Settings>(cmd);
        } catch (err) {
          ErrorHandler.handle(new TauriInteropException('Failed to get settings via Tauri', err, 'ERR_TAURI_SETTINGS_GET'));
          throw err;
        }
      },

      save: async (settings: Settings): Promise<void> => {
        try {
          const cmd: SettingsPersistenceCommand = 'save_settings';
          await invoke(cmd, { settings });
        } catch (err) {
          ErrorHandler.handle(new TauriInteropException('Failed to save settings via Tauri', err, 'ERR_TAURI_SETTINGS_SAVE'));
          throw err;
        }
      }
    };
  }
}

import { invoke } from '@tauri-apps/api/core';
import { IPersistence, ICorePersistence, IProjectsPersistence, ITasksPersistence, ISettingsPersistence, IRuntimeConfigPersistence, ITimeLogsPersistence } from './IPersistence';
import { ErrorHandler, TauriInteropException } from '../exceptions';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { CorePersistenceCommand } from '@bindings/CorePersistenceCommand';
import { ProjectsPersistenceCommand } from '@bindings/ProjectsPersistenceCommand';
import { TasksPersistenceCommand } from '@bindings/TasksPersistenceCommand';
import { SettingsPersistenceCommand } from '@bindings/SettingsPersistenceCommand';
import { Settings } from '@bindings/Settings';
import { TimeLog } from '@bindings/TimeLog';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { RuntimeConfig } from '@bindings/RuntimeConfig';

export class PersistenceCommands implements IPersistence {
  public core: ICorePersistence;
  public projects: IProjectsPersistence;
  public tasks: ITasksPersistence;
  public settings: ISettingsPersistence;
  public runtimeConfigs: IRuntimeConfigPersistence;
  public timeLogs: ITimeLogsPersistence;

  constructor() {
    this.core = {
      load: async (): Promise<TimerRepositoryState | null> => {
        try {
          const cmd: CorePersistenceCommand = 'get_state';
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
          await invoke('override_state', { state });
        } catch (err) {
          ErrorHandler.handle(new TauriInteropException('override_state command not supported by backend', err, 'WARN_TAURI_OVERRIDE'));
        }
        const currentState = await this.core.load();
        return currentState || { projects: [], tasks: [], logs: [], activeLog: null };
      },

      reset: async (): Promise<TimerRepositoryState> => {
        const cmd: CorePersistenceCommand = 'reset';
        return invoke<TimerRepositoryState>(cmd);
      }
    };

    this.projects = {
      add: async (input: {
        name: string;
        color: string;
        description?: string | null;
        icon?: string | null;
        tags?: string[] | null;
      }): Promise<TimerRepositoryState> => {
        const cmd: ProjectsPersistenceCommand = 'add';
        return invoke<TimerRepositoryState>(cmd, {
          name: input.name,
          color: input.color,
          description: input.description ?? null,
          icon: input.icon ?? null,
          tags: input.tags ?? null,
        });
      },

      toggleArchive: async (projectId: string): Promise<TimerRepositoryState> => {
        const cmd: ProjectsPersistenceCommand = 'toggle_archive';
        return invoke<TimerRepositoryState>(cmd, { projectId });
      },

      update: async (
        projectId: string,
        name: string,
        color: string,
        description: string | null,
        icon: string | null,
        tags: string[] | null
      ): Promise<TimerRepositoryState> => {
        const cmd = 'update_project';
        return invoke<TimerRepositoryState>(cmd, {
          projectId,
          name,
          color,
          description,
          icon,
          tags,
        });
      },

      rename: async (projectId: string, name: string): Promise<TimerRepositoryState> => {
        const cmd: ProjectsPersistenceCommand = 'rename';
        return invoke<TimerRepositoryState>(cmd, { projectId, name });
      }
    };

    this.tasks = {
      add: async (input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState> => {
        const cmd: TasksPersistenceCommand = 'create';
        return invoke<TimerRepositoryState>(cmd, {
          projectId: input.projectId,
          name: input.name,
          parentTaskId: input.parentTaskId,
        });
      },

      update: async (
        taskId: string,
        name: string,
        parentTaskId: string | null,
        status: TaskStatus | null,
        completed: boolean | null
      ): Promise<TimerRepositoryState> => {
        const cmd = 'update_task';
        return invoke<TimerRepositoryState>(cmd, {
          taskId,
          name,
          parentTaskId,
          status,
          completed,
        });
      },

      rename: async (taskId: string, name: string): Promise<TimerRepositoryState> => {
        const cmd: TasksPersistenceCommand = 'update';
        return invoke<TimerRepositoryState>(cmd, { taskId, name });
      },

      delete: async (taskId: string): Promise<TimerRepositoryState> => {
        const cmd: TasksPersistenceCommand = 'delete';
        return invoke<TimerRepositoryState>(cmd, { taskId });
      },

      toggleComplete: async (taskId: string): Promise<TimerRepositoryState> => {
        const cmd: TasksPersistenceCommand = 'toggle_complete';
        return invoke<TimerRepositoryState>(cmd, { taskId });
      },

      getProjectId: async (taskId: string): Promise<string> => {
        const state = await this.core.load();
        const task = state?.tasks.find(t => t.id === taskId);
        if (!task) throw new Error(`Task ${taskId} not found`);
        return task.projectId;
      },

      getSubtasks: async (taskId: string): Promise<Task[]> => {
        const state = await this.core.load();
        return state?.tasks.filter(t => t.parentTaskId === taskId) || [];
      }
    };

    this.settings = {
      get: async (): Promise<Settings> => {
        try {
          const cmd: SettingsPersistenceCommand = 'get';
          return await invoke<Settings>(cmd);
        } catch (err) {
          ErrorHandler.handle(new TauriInteropException('Failed to get settings via Tauri', err, 'ERR_TAURI_SETTINGS_GET'));
          throw err;
        }
      },

      save: async (settings: Settings): Promise<void> => {
        try {
          const cmd: SettingsPersistenceCommand = 'save';
          await invoke(cmd, { settings });
        } catch (err) {
          ErrorHandler.handle(new TauriInteropException('Failed to save settings via Tauri', err, 'ERR_TAURI_SETTINGS_SAVE'));
          throw err;
        }
      }
    };

    this.runtimeConfigs = {
      save: async (config: RuntimeConfig): Promise<void> => {
        try {
          const cmd = 'save_runtime_config';
          await invoke(cmd, { config });
        } catch (err) {
          ErrorHandler.handle(new TauriInteropException('Failed to save runtime config via Tauri', err, 'ERR_TAURI_RUN_CONFIG_SAVE'));
          throw err;
        }
      },

      getAll: async (): Promise<RuntimeConfig[]> => {
        try {
          const cmd = 'get_runtime_configs';
          return await invoke<RuntimeConfig[]>(cmd);
        } catch (err) {
          ErrorHandler.handle(new TauriInteropException('Failed to get runtime configs via Tauri', err, 'ERR_TAURI_RUN_CONFIG_GET'));
          throw err;
        }
      }
    };

    this.timeLogs = {
      getForTask: async (taskId: string): Promise<TimeLog[]> => {
        return invoke<TimeLog[]>('get_for_task', { taskId });
      },
      closeActiveByProject: async (endTime: string, projectId: string): Promise<void> => {
        await invoke('close_active_by_project', { endTime, projectId });
      },
      closeAllActive: async (endTime: string): Promise<void> => {
        await invoke('close_all_active', { endTime });
      },
      insert: async (logId: string, taskId: string, startTime: string): Promise<void> => {
        await invoke('insert', { logId, taskId, startTime });
      },
      queryActive: async (): Promise<string[]> => {
        return invoke<string[]>('query_active');
      },
      getAll: async (): Promise<TimeLog[]> => {
        return invoke<TimeLog[]>('get_all');
      }
    };
  }
}


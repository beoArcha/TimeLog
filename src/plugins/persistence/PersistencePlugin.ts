import { IPersistence, ICorePersistence, IProjectsPersistence, ITasksPersistence, ISettingsPersistence, IRuntimeConfigPersistence, ITimeLogsPersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { Settings } from '@bindings/Settings';
import { TimeLog } from '@bindings/TimeLog';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { RuntimeConfig } from '@bindings/RuntimeConfig';

const STORAGE_KEY = 'timelog_persistence_plugin_state';
const SETTINGS_KEY = 'timelog_persistence_plugin_settings';
const RUN_CONFIGS_KEY = 'timelog_persistence_plugin_runtime_configs';

const getDefaultState = (): TimerRepositoryState => ({
  projects: [],
  tasks: [],
  logs: [],
  activeLog: null,
});

export class PersistencePlugin implements IPersistence {
  public core: ICorePersistence;
  public projects: IProjectsPersistence;
  public tasks: ITasksPersistence;
  public settings: ISettingsPersistence;
  public runtimeConfigs: IRuntimeConfigPersistence;
  public timeLogs: ITimeLogsPersistence;

  constructor() {
    this.core = {
      load: async (): Promise<TimerRepositoryState | null> => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) return getDefaultState();
        try {
          return JSON.parse(data) as TimerRepositoryState;
        } catch (e) {
          ErrorHandler.handle(new PersistenceException('Failed to parse persistence state from LocalStorage', e, 'ERR_PERSISTENCE_PARSE'));
          return getDefaultState();
        }
      },
      overrideState: async (state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        const newState = { ...current, ...state };
        return this.save(newState);
      },
      reset: async (): Promise<TimerRepositoryState> => {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        localStorage.removeItem(RUN_CONFIGS_KEY);
        return getDefaultState();
      }
    };

    this.projects = {
      add: async (input: {
        name: string;
        color: string;
        description: string | null;
        icon: string | null;
        tags: string[] | null;
      }): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        const now = new Date().toISOString();
        const newProject = {
          id: crypto.randomUUID(),
          name: input.name,
          color: input.color,
          createdAt: now,
          archived: false,
          description: input.description || undefined,
          icon: input.icon || undefined,
          tags: input.tags || undefined,
        };
        current.projects.push(newProject);
        return this.save(current);
      },
      toggleArchive: async (projectId: string): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        const project = current.projects.find(p => p.id === projectId);
        if (project) {
          project.archived = !project.archived;
        }
        return this.save(current);
      },
      update: async (
        projectId: string,
        name: string,
        color: string,
        description: string | null,
        icon: string | null,
        tags: string[] | null
      ): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        const project = current.projects.find(p => p.id === projectId);
        if (project) {
          project.name = name;
          project.color = color;
          project.description = description || undefined;
          project.icon = icon || undefined;
          project.tags = tags || undefined;
        }
        return this.save(current);
      },
      rename: async (projectId: string, name: string): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        const project = current.projects.find(p => p.id === projectId);
        if (project) {
          project.name = name;
        }
        return this.save(current);
      }
    };

    this.tasks = {
      add: async (input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        
        // Hierarchy validation
        if (input.parentTaskId) {
          const parent = current.tasks.find(t => t.id === input.parentTaskId);
          if (parent && parent.parentTaskId) {
            throw new PersistenceException('Cannot nest tasks more than one level deep', undefined, 'ERR_PERSISTENCE_HIERARCHY');
          }
        }

        const now = new Date().toISOString();
        const newTask = {
          id: crypto.randomUUID(),
          projectId: input.projectId,
          name: input.name,
          parentTaskId: input.parentTaskId || undefined,
          createdAt: now,
          completed: false,
          status: 'Todo' as TaskStatus,
        };
        current.tasks.push(newTask);
        return this.save(current);
      },
      update: async (
        taskId: string,
        name: string,
        parentTaskId: string | null,
        status: TaskStatus | null,
        completed: boolean | null
      ): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        
        // Hierarchy validation
        if (parentTaskId) {
          if (taskId === parentTaskId) {
            throw new PersistenceException('Task cannot be its own parent', undefined, 'ERR_PERSISTENCE_HIERARCHY');
          }
          const parent = current.tasks.find(t => t.id === parentTaskId);
          if (parent && parent.parentTaskId) {
            throw new PersistenceException('Cannot nest tasks more than one level deep', undefined, 'ERR_PERSISTENCE_HIERARCHY');
          }
          const hasSubtasks = current.tasks.some(t => t.parentTaskId === taskId);
          if (hasSubtasks) {
            throw new PersistenceException('Cannot set a parent for a task that already has subtasks', undefined, 'ERR_PERSISTENCE_HIERARCHY');
          }
        }

        const task = current.tasks.find(t => t.id === taskId);
        if (task) {
          task.name = name;
          task.parentTaskId = parentTaskId || undefined;
          
          if (completed !== null) {
            task.completed = completed;
            if (completed) {
              task.status = 'Done';
            } else if (task.status === 'Done') {
              task.status = 'Todo';
            }
          } else if (status !== null) {
            task.status = status;
            task.completed = (status === 'Done');
          }
        }
        return this.save(current);
      },
      rename: async (taskId: string, name: string): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        const task = current.tasks.find(t => t.id === taskId);
        if (task) {
          task.name = name;
        }
        return this.save(current);
      },
      delete: async (taskId: string): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        current.tasks = current.tasks.filter(t => t.id !== taskId);
        return this.save(current);
      },
      toggleComplete: async (taskId: string): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        const task = current.tasks.find(t => t.id === taskId);
        if (task) {
          task.completed = !task.completed;
          task.status = task.completed ? 'Done' : 'Todo';
        }
        return this.save(current);
      },
      getProjectId: async (taskId: string): Promise<string> => {
        const current = (await this.core.load()) || getDefaultState();
        const task = current.tasks.find(t => t.id === taskId);
        if (!task) throw new PersistenceException(`Task ${taskId} not found`, undefined, 'ERR_PERSISTENCE_TASK_NOT_FOUND');
        return task.projectId;
      },
      getSubtasks: async (taskId: string): Promise<Task[]> => {
        const current = (await this.core.load()) || getDefaultState();
        return current.tasks.filter(t => t.parentTaskId === taskId);
      }
    };

    this.settings = {
      get: async (): Promise<Settings> => {
        const data = localStorage.getItem(SETTINGS_KEY);
        const defaults: Settings = {
          autoStart: false,
          autoPauseOnSleep: true,
          includePatchesInReports: true,
          activeSinks: ['Csv'],
          theme: 'system',
          textAndIconSize: 'medium',
          guiVariant: 'large',
          alwaysOnTopSmall: false,
          alwaysOnTopMain: false,
          minimizeToTray: true,
        };
        if (!data) return defaults;
        try {
          return { ...defaults, ...JSON.parse(data) };
        } catch {
          return defaults;
        }
      },
      save: async (settings: Settings): Promise<void> => {
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
          ErrorHandler.handle(new PersistenceException('Failed to save settings to LocalStorage', e, 'ERR_PERSISTENCE_SETTINGS_SAVE'));
          throw e;
        }
      }
    };

    this.runtimeConfigs = {
      save: async (config: RuntimeConfig): Promise<void> => {
        try {
          const data = localStorage.getItem(RUN_CONFIGS_KEY);
          const list: RuntimeConfig[] = data ? JSON.parse(data) : [];
          const idx = list.findIndex(c => c.id === config.id);
          if (idx !== -1) {
            list[idx] = config;
          } else {
            list.push(config);
          }
          localStorage.setItem(RUN_CONFIGS_KEY, JSON.stringify(list));
        } catch (e) {
          ErrorHandler.handle(new PersistenceException('Failed to save runtime config to LocalStorage', e, 'ERR_PERSISTENCE_RUN_CONFIG_SAVE'));
          throw e;
        }
      },
      getAll: async (): Promise<RuntimeConfig[]> => {
        try {
          const data = localStorage.getItem(RUN_CONFIGS_KEY);
          return data ? JSON.parse(data) : [];
        } catch (e) {
          ErrorHandler.handle(new PersistenceException('Failed to get runtime configs from LocalStorage', e, 'ERR_PERSISTENCE_RUN_CONFIG_GET'));
          return [];
        }
      }
    };

    this.timeLogs = {
      getForTask: async (taskId: string): Promise<TimeLog[]> => {
        const current = (await this.core.load()) || getDefaultState();
        return current.logs.filter(l => l.taskId === taskId);
      },
      closeActiveByProject: async (endTime: string, projectId: string): Promise<void> => {
        const current = (await this.core.load()) || getDefaultState();
        const projectTaskIds = new Set(current.tasks.filter(t => t.projectId === projectId).map(t => t.id));
        let changed = false;
        current.logs = current.logs.map(log => {
          if (!log.endTime && projectTaskIds.has(log.taskId)) {
            changed = true;
            return { ...log, endTime };
          }
          return log;
        });
        if (changed) {
          current.activeLog = current.logs.find(l => !l.endTime) || null;
          await this.save(current);
        }
      },
      closeAllActive: async (endTime: string): Promise<void> => {
        const current = (await this.core.load()) || getDefaultState();
        let changed = false;
        current.logs = current.logs.map(log => {
          if (!log.endTime) {
            changed = true;
            return { ...log, endTime };
          }
          return log;
        });
        if (changed) {
          current.activeLog = null;
          await this.save(current);
        }
      },
      insert: async (logId: string, taskId: string, startTime: string): Promise<void> => {
        const current = (await this.core.load()) || getDefaultState();
        const task = current.tasks.find(t => t.id === taskId);
        if (!task) throw new PersistenceException(`Task ${taskId} not found`, undefined, 'ERR_PERSISTENCE_TASK_NOT_FOUND');
        const newLog: TimeLog = {
          id: logId,
          taskId,
          projectId: task.projectId,
          startTime,
          endTime: undefined,
          note: undefined,
          editHistory: undefined
        };
        current.logs.push(newLog);
        current.activeLog = newLog;
        await this.save(current);
      },
      queryActive: async (): Promise<string[]> => {
        const current = (await this.core.load()) || getDefaultState();
        return current.logs.filter(l => !l.endTime).map(l => l.taskId);
      },
      getAll: async (): Promise<TimeLog[]> => {
        const current = (await this.core.load()) || getDefaultState();
        return current.logs;
      }
    };
  }

  private async save(state: TimerRepositoryState): Promise<TimerRepositoryState> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    } catch (e) {
      ErrorHandler.handle(new PersistenceException('Failed to save persistence state to LocalStorage', e, 'ERR_PERSISTENCE_SAVE'));
      throw e;
    }
  }
}

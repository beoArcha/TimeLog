import { IPersistence, ICorePersistence, IProjectsPersistence, ITasksPersistence, ISettingsPersistence, ITimeLogsPersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { Settings } from '@bindings/Settings';
import { TimeLog } from '@bindings/TimeLog';
import { Task } from '@bindings/Task';

const STORAGE_KEY = 'timelog_persistence_plugin_state';
const SETTINGS_KEY = 'timelog_persistence_plugin_settings';

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
        return getDefaultState();
      }
    };

    this.projects = {
      add: async (input: { name: string; color: string }): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        const now = new Date().toISOString();
        const newProject = {
          id: crypto.randomUUID(),
          name: input.name,
          color: input.color,
          createdAt: now,
          archived: false,
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
        const now = new Date().toISOString();
        const newTask = {
          id: crypto.randomUUID(),
          projectId: input.projectId,
          name: input.name,
          parentTaskId: input.parentTaskId,
          createdAt: now,
          completed: false,
        };
        current.tasks.push(newTask);
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
        if (!data) {
          return { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: true, activeSinks: ['Csv'] };
        }
        try {
          return JSON.parse(data) as Settings;
        } catch {
          return { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: true, activeSinks: ['Csv'] };
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
          endTime: null,
          note: null,
          originalStartTime: null,
          originalEndTime: null,
          originalNote: null,
          editHistory: null
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

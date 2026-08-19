import { IPersistence, ICorePersistence, IProjectsPersistence, ITasksPersistence, ISettingsPersistence, IRuntimeConfigPersistence, ITimeLogsPersistence, IHolidaysPersistence, IPatchesPersistence, IUiStatePersistence, IExternalApiPersistence, ILocalePersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { Settings } from '@bindings/Settings';
import { TimeLog } from '@bindings/TimeLog';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { RuntimeConfig } from '@bindings/RuntimeConfig';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { INIT_PROJECTS, INIT_TASKS, INIT_LOGS, DEFAULT_HOLIDAYS } from './InitialData';
import { STORAGE_KEYS } from '@common/constants/storage-keys';

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
  public holidays: IHolidaysPersistence;
  public patches: IPatchesPersistence;
  public uiState: IUiStatePersistence;
  public externalApi: IExternalApiPersistence;
  public locale: ILocalePersistence;

  constructor() {
    this.core = {
      load: async (): Promise<TimerRepositoryState | null> => {
        const data = localStorage.getItem(STORAGE_KEYS.STORAGE_KEY);
        if (!data) {
          // Initialize empty local storage with defaults on first run
          localStorage.setItem(STORAGE_KEYS.HOLIDAYS_KEY, JSON.stringify(DEFAULT_HOLIDAYS));
          const seedState = {
            projects: INIT_PROJECTS,
            tasks: INIT_TASKS,
            logs: INIT_LOGS,
            activeLog: null
          };
          await this.save(seedState);
          return seedState;
        }
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
        localStorage.removeItem(STORAGE_KEYS.STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS_KEY);
        localStorage.removeItem(STORAGE_KEYS.RUN_CONFIGS_KEY);
        localStorage.removeItem(STORAGE_KEYS.HOLIDAYS_KEY);
        return getDefaultState();
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
          if (project.archived) {
            const projectTaskIds = new Set(
              current.tasks.filter(t => t.projectId === projectId).map(t => t.id)
            );
            if (current.activeLog && projectTaskIds.has(current.activeLog.taskId)) {
              const now = new Date().toISOString();
              current.activeLog.endTime = now;
              current.logs = current.logs.map(l =>
                l.id === current.activeLog?.id ? { ...l, endTime: now } : l
              );
              current.activeLog = null;
            }
          }
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
      delete: async (id: string): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();

        const idsToDelete = new Set<string>([id]);
        let added: boolean;
        do {
          added = false;
          current.tasks.forEach(t => {
            if (t.parentTaskId && idsToDelete.has(t.parentTaskId) && !idsToDelete.has(t.id)) {
              idsToDelete.add(t.id);
              added = true;
            }
          });
        } while (added);

        current.tasks = current.tasks.filter(t => !idsToDelete.has(t.id));
        current.logs = current.logs.filter(l => !idsToDelete.has(l.taskId));

        if (current.activeLog && idsToDelete.has(current.activeLog.taskId)) {
          current.activeLog = null;
        }

        return this.save(current);
      },
      toggleComplete: async (taskId: string): Promise<TimerRepositoryState> => {
        const current = (await this.core.load()) || getDefaultState();
        const task = current.tasks.find(t => t.id === taskId);
        if (task) {
          task.completed = !task.completed;
          task.status = task.completed ? 'Done' : 'Todo';
          if (task.completed && current.activeLog?.taskId === taskId) {
            const now = new Date().toISOString();
            current.activeLog.endTime = now;
            current.logs = current.logs.map(l => l.id === current.activeLog?.id ? { ...l, endTime: now } : l);
            current.activeLog = null;
          }
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
        const data = localStorage.getItem(STORAGE_KEYS.SETTINGS_KEY);
        const defaults: Settings = {
          autoStart: false,
          autoPauseOnSleep: true,
          includePatchesInReports: true,
          activeSinks: ['Csv'],
          theme: 'system',
          textAndIconSize: 'medium',
          guiVariant: 'full',
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
          localStorage.setItem(STORAGE_KEYS.SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
          ErrorHandler.handle(new PersistenceException('Failed to save settings to LocalStorage', e, 'ERR_PERSISTENCE_SETTINGS_SAVE'));
          throw e;
        }
      }
    };

    this.runtimeConfigs = {
      save: async (config: RuntimeConfig): Promise<void> => {
        try {
          const data = localStorage.getItem(STORAGE_KEYS.RUN_CONFIGS_KEY);
          const list: RuntimeConfig[] = data ? JSON.parse(data) : [];
          const idx = list.findIndex(c => c.id === config.id);
          if (idx !== -1) {
            list[idx] = config;
          } else {
            list.push(config);
          }
          localStorage.setItem(STORAGE_KEYS.RUN_CONFIGS_KEY, JSON.stringify(list));
        } catch (e) {
          ErrorHandler.handle(new PersistenceException('Failed to save runtime config to LocalStorage', e, 'ERR_PERSISTENCE_RUN_CONFIG_SAVE'));
          throw e;
        }
      },
      getAll: async (): Promise<RuntimeConfig[]> => {
        try {
          const data = localStorage.getItem(STORAGE_KEYS.RUN_CONFIGS_KEY);
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

    this.holidays = {
      getAll: async (): Promise<HolidayLeave[]> => {
        const data = localStorage.getItem(STORAGE_KEYS.HOLIDAYS_KEY);
        if (!data) return DEFAULT_HOLIDAYS;
        try {
          return JSON.parse(data);
        } catch {
          return DEFAULT_HOLIDAYS;
        }
      },
      save: async (holidays: HolidayLeave[]): Promise<void> => {
        localStorage.setItem(STORAGE_KEYS.HOLIDAYS_KEY, JSON.stringify(holidays));
      }
    };

    this.patches = {
      getAll: async (): Promise<PatchLog[]> => {
        const data = localStorage.getItem(STORAGE_KEYS.PATCHES);
        if (!data) return [];
        try {
          return JSON.parse(data);
        } catch {
          return [];
        }
      },
      save: async (patches: PatchLog[]): Promise<void> => {
        localStorage.setItem(STORAGE_KEYS.PATCHES, JSON.stringify(patches));
      }
    };

    this.uiState = {
      getCurrentProjectId: async (): Promise<string | null> => {
        return localStorage.getItem(STORAGE_KEYS.CURRENT_PROJ_ID);
      },
      saveCurrentProjectId: async (id: string): Promise<void> => {
        localStorage.setItem(STORAGE_KEYS.CURRENT_PROJ_ID, id);
      },
      getLastNonCompactVariant: async (): Promise<string> => {
        return localStorage.getItem(STORAGE_KEYS.LAST_NON_COMPACT_VARIANT) || 'full';
      },
      saveLastNonCompactVariant: async (variant: string): Promise<void> => {
        localStorage.setItem(STORAGE_KEYS.LAST_NON_COMPACT_VARIANT, variant);
      }
    };

    this.externalApi = {
      getSettings: async () => {
        return {
          logToApi: localStorage.getItem(STORAGE_KEYS.LOG_TO_API) === 'true',
          apiToken: localStorage.getItem(STORAGE_KEYS.API_TOKEN) || '',
          apiUrl: localStorage.getItem(STORAGE_KEYS.API_URL) || '',
          apiMethod: (localStorage.getItem(STORAGE_KEYS.API_METHOD) as 'POST' | 'PUT') || 'POST',
          apiHeaders: localStorage.getItem(STORAGE_KEYS.API_HEADERS) || '',
        };
      },
      saveSettings: async (settings) => {
        localStorage.setItem(STORAGE_KEYS.LOG_TO_API, String(settings.logToApi));
        localStorage.setItem(STORAGE_KEYS.API_TOKEN, settings.apiToken);
        localStorage.setItem(STORAGE_KEYS.API_URL, settings.apiUrl);
        localStorage.setItem(STORAGE_KEYS.API_METHOD, settings.apiMethod);
        localStorage.setItem(STORAGE_KEYS.API_HEADERS, settings.apiHeaders);
      }
    };

    this.locale = {
      getLocalePref: async () => localStorage.getItem(STORAGE_KEYS.LOCALE_PREF) || 'system',
      saveLocalePref: async (pref: string) => localStorage.setItem(STORAGE_KEYS.LOCALE_PREF, pref),
      getLocale: async () => localStorage.getItem(STORAGE_KEYS.LOCALE) || 'system',
      saveLocale: async (loc: string) => localStorage.setItem(STORAGE_KEYS.LOCALE, loc),
      getCustomTranslations: async () => {
        const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS);
        if (saved) {
          try { return JSON.parse(saved); } catch (_) { return {}; }
        }
        return {};
      },
      saveCustomTranslations: async (translations) => {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS, JSON.stringify(translations));
      }
    };
  }

  private async save(state: TimerRepositoryState): Promise<TimerRepositoryState> {
    try {
      localStorage.setItem(STORAGE_KEYS.STORAGE_KEY, JSON.stringify(state));
      return state;
    } catch (e) {
      ErrorHandler.handle(new PersistenceException('Failed to save persistence state to LocalStorage', e, 'ERR_PERSISTENCE_SAVE'));
      throw e;
    }
  }
}

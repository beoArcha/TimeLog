import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { TimeLog } from '@bindings/TimeLog';
import { Settings } from '@bindings/Settings';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { RuntimeConfig } from '@bindings/RuntimeConfig';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';

export type ApiPayload = {
  event: string;
  log: TimeLog | (TimeLog & { endTime: string });
};

export interface ICorePersistence {
  load(): Promise<TimerRepositoryState | null>;
  overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState>;
  reset(): Promise<TimerRepositoryState>;
}

export interface IProjectsPersistence {
  add(input: {
    name: string;
    color: string;
    description?: string | null;
    icon?: string | null;
    tags?: string[] | null;
  }): Promise<TimerRepositoryState>;
  toggleArchive(projectId: string): Promise<TimerRepositoryState>;
  update(
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ): Promise<TimerRepositoryState>;
  rename(projectId: string, name: string): Promise<TimerRepositoryState>;
}

export interface ITasksPersistence {
  add(input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState>;
  update(
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ): Promise<TimerRepositoryState>;
  rename(taskId: string, name: string): Promise<TimerRepositoryState>;
  delete(taskId: string): Promise<TimerRepositoryState>;
  toggleComplete(taskId: string): Promise<TimerRepositoryState>;
  getProjectId(taskId: string): Promise<string>;
  getSubtasks(taskId: string): Promise<Task[]>;
}

export interface ISettingsPersistence {
  get(): Promise<Settings>;
  save(settings: Settings): Promise<void>;
}

export interface IRuntimeConfigPersistence {
  save(config: RuntimeConfig): Promise<void>;
  getAll(): Promise<RuntimeConfig[]>;
}

export interface IHolidaysPersistence {
  getAll(): Promise<HolidayLeave[]>;
  save(holidays: HolidayLeave[]): Promise<void>;
}

export interface IPatchesPersistence {
  getAll(): Promise<PatchLog[]>;
  save(patches: PatchLog[]): Promise<void>;
}

export interface IUiStatePersistence {
  getCurrentProjectId(): Promise<string | null>;
  saveCurrentProjectId(id: string): Promise<void>;
  getLastNonCompactVariant(): Promise<string>;
  saveLastNonCompactVariant(variant: string): Promise<void>;
}

export interface IExternalApiPersistence {
  getSettings(): Promise<{ logToApi: boolean; apiToken: string; apiUrl: string; apiMethod: 'POST' | 'PUT'; apiHeaders: string }>;
  saveSettings(settings: { logToApi: boolean; apiToken: string; apiUrl: string; apiMethod: 'POST' | 'PUT'; apiHeaders: string }): Promise<void>;
}

export interface ILocalePersistence {
  getLocalePref(): Promise<string>;
  saveLocalePref(localePref: string): Promise<void>;
  getLocale(): Promise<string>;
  saveLocale(locale: string): Promise<void>;
  getCustomTranslations(): Promise<Record<string, Record<string, string>>>;
  saveCustomTranslations(translations: Record<string, Record<string, string>>): Promise<void>;
}

export interface ITimeLogsPersistence {
  getForTask(taskId: string): Promise<TimeLog[]>;
  closeActiveByProject(endTime: string, projectId: string): Promise<void>;
  closeAllActive(endTime: string): Promise<void>;
  insert(logId: string, taskId: string, startTime: string): Promise<void>;
  queryActive(): Promise<string[]>;
  getAll(): Promise<TimeLog[]>;
}

export interface IPersistence {
  core: ICorePersistence;
  projects: IProjectsPersistence;
  tasks: ITasksPersistence;
  settings: ISettingsPersistence;
  runtimeConfigs: IRuntimeConfigPersistence;
  timeLogs: ITimeLogsPersistence;
  holidays: IHolidaysPersistence;
  patches: IPatchesPersistence;
  uiState: IUiStatePersistence;
  externalApi: IExternalApiPersistence;
  locale: ILocalePersistence;
}


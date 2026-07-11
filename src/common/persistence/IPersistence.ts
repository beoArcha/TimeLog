import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { TimeLog } from '@bindings/TimeLog';
import { Settings } from '@bindings/Settings';
import { Task } from '@bindings/Task';

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
  add(input: { name: string; color: string }): Promise<TimerRepositoryState>;
  toggleArchive(projectId: string): Promise<TimerRepositoryState>;
  rename(projectId: string, name: string): Promise<TimerRepositoryState>;
}

export interface ITasksPersistence {
  add(input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState>;
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
  timeLogs: ITimeLogsPersistence;
}

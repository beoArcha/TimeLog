import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

export type ApiPayload = {
  event: string;
  log: TimeLog | (TimeLog & { endTime: string });
};

export type TimerRepositoryState = {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
};

export type RepositoryBackend = 'localStorage' | 'sqlite' | 'remote';

export type RepositorySource = {
  kind: RepositoryBackend;
  enabled: boolean;
  primary: boolean;
};

export interface TimerRepository {
  load(): Promise<TimerRepositoryState | null>;

  overrideState(
    state: Partial<TimerRepositoryState>
  ): Promise<TimerRepositoryState>;

  addProject(input: {
    name: string;
    color: string;
  }): Promise<TimerRepositoryState>;

  toggleProjectArchive(
    projectId: string
  ): Promise<TimerRepositoryState>;

  addTask(input: {
    projectId: string;
    name: string;
    parentTaskId: string | null;
  }): Promise<TimerRepositoryState>;

  renameProject(
    projectId: string,
    name: string
  ): Promise<TimerRepositoryState>;

  renameTask(
    taskId: string,
    name: string
  ): Promise<TimerRepositoryState>;

  deleteTask(
    taskId: string
  ): Promise<TimerRepositoryState>;

  toggleTaskComplete(
    taskId: string
  ): Promise<TimerRepositoryState>;

  startTimer(
    taskId: string
  ): Promise<{
    state: TimerRepositoryState;
    events: ApiPayload[];
  }>;

  stopTimer(
    projectId?: string
  ): Promise<{
    state: TimerRepositoryState;
    events: ApiPayload[];
  }>;

  reset(): Promise<TimerRepositoryState>;
}

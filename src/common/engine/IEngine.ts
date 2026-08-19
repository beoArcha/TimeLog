import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { TaskStatus } from '@bindings/TaskStatus';
import { Settings } from '@bindings/Settings';
import { RuntimeConfig } from '@bindings/RuntimeConfig';
import { ElapsedRangeFilter } from '../../plugins/engine/elapsed';

export interface CreateProjectInput {
  name: string;
  color: string;
  description?: string | null;
  icon?: string | null;
  tags?: string[] | null;
}

export interface CreateTaskInput {
  projectId: string;
  name: string;
  parentTaskId?: string | null;
}

export interface IEngine {
  // Timer Lifecycle
  startTimer(taskId: string): Promise<void>;
  stopTimer(projectId?: string): Promise<void>;
  resumeTimer?(taskId: string): Promise<void>;
  getActiveLogs?(): Promise<string[]>;

  // Pure Elapsed Accessors
  getTaskElapsed?(taskId: string, nowIso?: string): Promise<number>;
  getProjectElapsed?(projectId: string, nowIso?: string): Promise<number>;
  getElapsedRange?(range: ElapsedRangeFilter, nowIso?: string): Promise<number>;

  // TimeLogs
  editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void>;

  // Projects
  addProject?(input: CreateProjectInput): Promise<TimerRepositoryState>;
  updateProject?(
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ): Promise<TimerRepositoryState>;
  renameProject?(projectId: string, name: string): Promise<TimerRepositoryState>;
  toggleProjectArchive?(projectId: string): Promise<TimerRepositoryState>;
  getProjectStatistics(projectId: string): Promise<ProjectStatistics>;

  // Tasks
  addTask?(input: CreateTaskInput): Promise<TimerRepositoryState>;
  updateTask?(
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ): Promise<TimerRepositoryState>;
  renameTask?(taskId: string, name: string): Promise<TimerRepositoryState>;
  deleteTask?(taskId: string): Promise<TimerRepositoryState>;
  toggleTaskComplete?(taskId: string): Promise<TimerRepositoryState>;

  // Configuration
  getSettings?(): Promise<Settings>;
  saveSettings?(settings: Settings): Promise<void>;
  getRuntimeConfigs?(): Promise<RuntimeConfig[]>;
  saveRuntimeConfig?(config: RuntimeConfig): Promise<void>;

  // State Management
  getState?(): Promise<TimerRepositoryState | null>;
  resetState?(): Promise<TimerRepositoryState>;
}



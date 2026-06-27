import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { TimeLog } from '@bindings/TimeLog';

export type ApiPayload = {
  event: string;
  log: TimeLog | (TimeLog & { endTime: string });
};

export interface IPersistence {
  load(): Promise<TimerRepositoryState | null>;
  overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState>;
  addProject(input: { name: string; color: string }): Promise<TimerRepositoryState>;
  toggleProjectArchive(projectId: string): Promise<TimerRepositoryState>;
  addTask(input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState>;
  renameProject(projectId: string, name: string): Promise<TimerRepositoryState>;
  renameTask(taskId: string, name: string): Promise<TimerRepositoryState>;
  deleteTask(taskId: string): Promise<TimerRepositoryState>;
  toggleTaskComplete(taskId: string): Promise<TimerRepositoryState>;
  
  // TODO(Stage EngineRouter):
  // Temporary compatibility proxy.
  startTimer(taskId: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }>;
  
  // TODO(Stage EngineRouter):
  // Temporary compatibility proxy.
  stopTimer(projectId?: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }>;
  
  reset(): Promise<TimerRepositoryState>;
}

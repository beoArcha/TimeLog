import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Settings } from '@bindings/Settings';

export interface MockDatabaseState {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
}

export interface MockCommandArgs {
  state?: Partial<MockDatabaseState>;
  settings?: Settings;
  name?: string;
  color?: string;
  projectId?: string;
  parentTaskId?: string | null;
  taskId?: string;
  id?: string;
  startTime?: string;
  endTime?: string | null;
  note?: string | null;
  reason?: string;
}

export type CommandHandlerFunc = (args: MockCommandArgs) => Promise<unknown>;

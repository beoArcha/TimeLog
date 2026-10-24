import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Settings } from '@bindings/Settings';

export interface MockDatabaseState {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
  activeLogs?: TimeLog[];
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
  description?: string | null;
  icon?: string | null;
  tags?: string[] | null;
  status?: Task['status'] | null;
  completed?: boolean | null;
  logId?: string;
  holidays?: unknown[];
  patches?: unknown[];
  variant?: string;
  pref?: string;
  locale?: string;
  translations?: string;
  [key: string]: unknown;
}

export type CommandHandlerFunc = (args: MockCommandArgs) => Promise<unknown>;

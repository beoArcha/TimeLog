import type { Project } from './bindings/Project';
import type { ProjectEditHistory } from './bindings/ProjectEditHistory';
import type { Task } from './bindings/Task';
import type { TaskEditHistory } from './bindings/TaskEditHistory';
import type { TimeLog } from './bindings/TimeLog';
import type { TimeLogEditHistory } from './bindings/TimeLogEditHistory';
import type { PatchLog } from './bindings/PatchLog';
import type { Settings } from './bindings/Settings';
import type { HolidayLeave } from './bindings/HolidayLeave';
import type { HolidayLeaveEditHistory } from './bindings/HolidayLeaveEditHistory';
import type { HolidayType } from './bindings/HolidayType';

export type {
  Project,
  ProjectEditHistory,
  Task,
  TaskEditHistory,
  TimeLog,
  TimeLogEditHistory,
  PatchLog,
  Settings,
  HolidayLeave,
  HolidayLeaveEditHistory,
  HolidayType,
};

export interface DatabaseState {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  holidays: HolidayLeave[];
  patches: PatchLog[];
}

export interface CliCommandHelp {
  command: string;
  description: string;
  usage: string;
}

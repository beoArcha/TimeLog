import React from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { Locale } from '@bindings/Locale';

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
}

export interface CliEngineContext {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
  metrics?: import('@bindings/EngineComputedMetrics').EngineComputedMetrics | null;
  onAddProject: (name: string, color: string) => void;
  onAddTask: (projectId: string, name: string, parentTaskId: string | null) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (projectId?: string) => void;
  nowIso?: string;
  locale: Locale;
  customTranslations?: Record<string, unknown>;
  holidays: HolidayLeave[];
  setHolidays: React.Dispatch<React.SetStateAction<HolidayLeave[]>>;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}

export { runProjectsCommand, runAddProjectCommand } from '../commands/projectCommands';
export { runTasksCommand, runAddTaskCommand, runAddSubtaskCommand, runCompleteCommand } from '../commands/taskCommands';
export { runStartCommand, runStopCommand, runStatusCommand } from '../commands/timerCommands';
export { runHolidaysCommand } from '../commands/holidayCommands';
export { runLogsCommand, runReportCommand, runTimeCommand } from './ReportCommands';


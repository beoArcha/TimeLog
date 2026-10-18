import React from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { Locale } from '@bindings/Locale';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
}

export interface CliEngineContext {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
  metrics?: EngineComputedMetrics | null;
  onAddProject: (name: string, color: string) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onAddTask: (projectId: string, name: string, parentTaskId: string | null) => void;
  onRenameTask: (taskId: string, name: string) => void;
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

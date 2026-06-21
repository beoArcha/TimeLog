import React from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { Settings } from '@bindings/Settings';
import { LocaleType, TranslationDictionary } from '@core/i18n/translations';
import { TextAndIconSize } from '@bindings/TextAndIconSize';

export interface GuiCommonProps {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
  holidays: HolidayLeave[];
  patches?: PatchLog[];
  sysSettings?: Settings;
  
  onAddProject: (name: string, color: string) => void;
  onAddTask: (projectId: string, name: string, parentTaskId: string | null) => void;
  onRenameProject?: (projectId: string, newName: string) => void;
  onRenameTask?: (taskId: string, newName: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (projectId?: string) => void;
  onToggleProjectArchive?: (projectId: string) => void;
  setHolidays: React.Dispatch<React.SetStateAction<HolidayLeave[]>>;
  
  nowIso: string;
  locale: LocaleType;
  customTranslations?: Partial<TranslationDictionary>;
  theme?: string;
  textAndIconSize?: TextAndIconSize;

  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  
  activeLargeTab?: string;
  activeView?: string;
}

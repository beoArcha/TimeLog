import React from 'react';
import { Project, Task, TimeLog, HolidayLeave, PatchLog, Settings } from '../../types';
import { LocaleType, TranslationDictionary } from '../../utils/translations';

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

  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  
  activeLargeTab?: string;
  activeView?: string;
}

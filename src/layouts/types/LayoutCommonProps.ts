import React from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { Settings } from '@bindings/Settings';
import { TranslationDictionary } from '@common/i18n/translator';
import { TextAndIconSize } from '@bindings/TextAndIconSize';
import { Locale } from '@/src/bindings/Locale';

export interface LayoutCommonProps {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
  holidays: HolidayLeave[];
  patches?: PatchLog[];
  sysSettings?: Settings;

  onAddProject: (
    name: string,
    color: string,
    description?: string | null,
    icon?: string | null,
    tags?: string[] | null
  ) => void;
  onAddTask: (projectId: string, name: string, parentTaskId: string | null) => void;
  onRenameProject?: (projectId: string, newName: string) => void;
  onRenameTask?: (taskId: string, newName: string) => void;
  onUpdateProject?: (
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ) => void;
  onUpdateTask?: (
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: import('@bindings/TaskStatus').TaskStatus | null,
    completed: boolean | null
  ) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (projectId?: string) => void;
  onToggleProjectArchive?: (projectId: string) => void;
  setHolidays: React.Dispatch<React.SetStateAction<HolidayLeave[]>>;

  nowIso: string;
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
  theme?: string;
  textAndIconSize?: TextAndIconSize;

  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;

  activeLargeTab?: string;
  activeView?: string;
}

export interface LayoutRouterProps {
  variant: import('@bindings/LayoutVariant').LayoutVariant;
  commonProps: LayoutCommonProps;

  isCompactExpanded: boolean;
  setIsCompactExpanded: (val: boolean) => void;
  showToast: (msg: string) => void;
  handleMinimizeToTray: () => void;
  setLayoutVariant: (variant: import('@bindings/LayoutVariant').LayoutVariant) => void;
  currentProjectId: string;
  lastNonCompactVariant?: Exclude<import('@bindings/LayoutVariant').LayoutVariant, 'compact'>;
  alwaysOnTopSmall: boolean;
  setAlwaysOnTopSmall: (val: boolean) => void;
}

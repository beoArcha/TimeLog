/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from 'react';
import { ContextException } from '../exceptions';
import { useOxyAppState } from '@common/hooks/useOxyAppState';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { Settings } from '@bindings/Settings';
import { TranslationDictionary } from '@common/i18n/translator';
import { LayoutVariant } from '@bindings/LayoutVariant';
import { TextAndIconSize } from '@bindings/TextAndIconSize';
import { Locale } from '@bindings/Locale';

export interface OxyFlowState {
  customTranslations: Partial<TranslationDictionary>;
  setCustomTranslations: React.Dispatch<React.SetStateAction<Partial<TranslationDictionary>>>;
  projects: Project[];
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  logs: TimeLog[];
  setLogs: React.Dispatch<React.SetStateAction<TimeLog[]>>;
  holidays: HolidayLeave[];
  setHolidays: React.Dispatch<React.SetStateAction<HolidayLeave[]>>;
  patches: PatchLog[];
  setPatches: React.Dispatch<React.SetStateAction<PatchLog[]>>;

  sysSettings: Settings;
  setSysSettings: React.Dispatch<React.SetStateAction<Settings>>;

  activeLog: TimeLog | null;
  setActiveLog: React.Dispatch<React.SetStateAction<TimeLog | null>>;

  localePref: Locale;
  setLocalePref: React.Dispatch<React.SetStateAction<Locale>>;
  locale: Locale;
  setLocale: React.Dispatch<React.SetStateAction<Locale>>;

  theme: import('@common/types/ThemeTypes').ThemePreference;
  setTheme: React.Dispatch<React.SetStateAction<import('@common/types/ThemeTypes').ThemePreference>>;
  resolvedTheme: import('@common/types/ThemeTypes').Theme;
  setResolvedTheme: React.Dispatch<React.SetStateAction<import('@common/types/ThemeTypes').Theme>>;

  textAndIconSize: TextAndIconSize;
  setTextAndIconSize: React.Dispatch<React.SetStateAction<TextAndIconSize>>;
  layoutVariant: LayoutVariant;
  setLayoutVariant: React.Dispatch<React.SetStateAction<LayoutVariant>>;

  engineState: 'searching' | 'connected';
  enginePID: number;

  minimizeToTray: boolean;
  setMinimizeToTray: React.Dispatch<React.SetStateAction<boolean>>;
  alwaysOnTopSmall: boolean;
  setAlwaysOnTopSmall: React.Dispatch<React.SetStateAction<boolean>>;
  alwaysOnTopMain: boolean;
  setAlwaysOnTopMain: React.Dispatch<React.SetStateAction<boolean>>;
  logToApi: boolean;
  setLogToApi: React.Dispatch<React.SetStateAction<boolean>>;
  apiToken: string;
  setApiToken: React.Dispatch<React.SetStateAction<string>>;
  apiMethod: 'POST' | 'PUT';
  setApiMethod: React.Dispatch<React.SetStateAction<'POST' | 'PUT'>>;
  apiHeaders: string;
  setApiHeaders: React.Dispatch<React.SetStateAction<string>>;
  apiUrl: string;
  setApiUrl: React.Dispatch<React.SetStateAction<string>>;

  nowIso: string;
  isGuiClosed: boolean;
  setIsGuiClosed: React.Dispatch<React.SetStateAction<boolean>>;
  isMinimized?: boolean;
  setIsMinimized?: React.Dispatch<React.SetStateAction<boolean>>;

  showToast?: (msg: string) => void;
  handleMinimizeToTray?: () => Promise<void>;
  handleResetLocalStorage?: () => void;
  showCreditsModal?: boolean;
  setShowCreditsModal?: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  handleAddProject: (name: string, color: string, description?: string | null, icon?: string | null, tags?: string[] | null) => void;
  handleToggleProjectArchive: (projectId: string) => void;
  handleAddTask: (projectId: string, name: string, parentTaskId: string | null) => void;
  handleUpdateProject: (
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ) => void;
  handleUpdateTask: (
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ) => void;
  handleRenameProject: (projectId: string, newName: string) => void;
  handleRenameTask: (taskId: string, newName: string) => void;
  handleDeleteTask: (taskId: string) => void;
  handleToggleTaskComplete: (taskId: string) => void;
  handleStartTimer: (taskId: string) => void;
  handleStopTimer: (specificProjectId?: string) => void;
  handleEditTimeLog: (
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ) => Promise<void>;
  handleRestoreState: (data: {
    projects?: Project[];
    tasks?: Task[];
    logs?: TimeLog[];
    holidays?: HolidayLeave[];
    patches?: PatchLog[];
  }) => Promise<void>;
  handleAddHoliday: (date: string, type: 'holiday' | 'leave', name: string) => void;
  handleDeleteHoliday: (id: string) => void;
}

export const OxyContext = createContext<OxyFlowState | undefined>(undefined);

export const useOxyFlow = () => {
  const ctx = useContext(OxyContext);
  if (!ctx) throw new ContextException('useOxyFlow must be used within OxyContext.Provider', 'ERR_OXY_CONTEXT');
  return ctx;
};

export const OxyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = useOxyAppState();
  return <OxyContext.Provider value={state}>{children}</OxyContext.Provider>;
};

import React, { createContext, useContext } from 'react';
import { Project, Task, TimeLog, HolidayLeave, PatchLog, Settings } from '../types';
import { LocaleType } from '../utils/translations';

import { TranslationDictionary } from '../utils/translations';

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
  
  localePref: LocaleType;
  setLocalePref: React.Dispatch<React.SetStateAction<LocaleType>>;
  locale: LocaleType;
  setLocale: React.Dispatch<React.SetStateAction<LocaleType>>;
  
  theme: 'dark' | 'light' | 'high-contrast' | 'system';
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light' | 'high-contrast' | 'system'>>;
  resolvedTheme: 'dark' | 'light' | 'high-contrast';
  setResolvedTheme: React.Dispatch<React.SetStateAction<'dark' | 'light' | 'high-contrast'>>;
  
  engineState: 'searching' | 'connected';
  enginePID: number;
  
  minimizeToTray: boolean;
  setMinimizeToTray: React.Dispatch<React.SetStateAction<boolean>>;
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
}

export const OxyContext = createContext<OxyFlowState | undefined>(undefined);

export const useOxyFlow = () => {
  const ctx = useContext(OxyContext);
  if (!ctx) throw new Error('useOxyFlow must be used within OxyContext.Provider');
  return ctx;
};

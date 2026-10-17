import type { Project } from '@bindings/Project';
import type { Task } from '@bindings/Task';
import type { TaskStatus } from '@bindings/TaskStatus';
import type { TimeLog } from '@bindings/TimeLog';
import type { HolidayLeave } from '@bindings/HolidayLeave';
import type { PatchLog } from '@bindings/PatchLog';
import type { Settings } from '@bindings/Settings';
import type { Locale } from '@bindings/Locale';
import type { LayoutVariant } from '@bindings/LayoutVariant';
import type { TextAndIconSize } from '@bindings/TextAndIconSize';
import type { Theme, ThemePreference } from '@common/types/ThemeTypes';
import type { TranslationDictionary } from '@common/i18n/types';
import { vi, type Mock } from 'vitest';

export interface OxyFlowState {
  customTranslations?: Partial<TranslationDictionary>;
  setCustomTranslations?: Mock | ((trans: Partial<TranslationDictionary> | ((prev: Partial<TranslationDictionary>) => Partial<TranslationDictionary>)) => void);
  projects?: Project[];
  setProjects?: Mock | ((projects: Project[] | ((prev: Project[]) => Project[])) => void);
  tasks?: Task[];
  setTasks?: Mock | ((tasks: Task[] | ((prev: Task[]) => Task[])) => void);
  logs?: TimeLog[];
  setLogs?: Mock | ((logs: TimeLog[] | ((prev: TimeLog[]) => TimeLog[])) => void);
  holidays?: HolidayLeave[];
  setHolidays?: Mock | ((holidays: HolidayLeave[] | ((prev: HolidayLeave[]) => HolidayLeave[])) => void);
  patches?: PatchLog[];
  setPatches?: Mock | ((patches: PatchLog[] | ((prev: PatchLog[]) => PatchLog[])) => void);
  sysSettings?: Settings;
  setSysSettings?: Mock | ((settings: Settings | ((prev: Settings) => Settings)) => void);
  activeLog?: TimeLog | null;
  setActiveLog?: Mock | ((log: TimeLog | null | ((prev: TimeLog | null) => TimeLog | null)) => void);
  localePref?: Locale;
  setLocalePref?: Mock | ((pref: Locale | ((prev: Locale) => Locale)) => void);
  locale?: Locale;
  setLocale?: Mock | ((locale: Locale | ((prev: Locale) => Locale)) => void);
  theme?: ThemePreference;
  setTheme?: Mock | ((theme: ThemePreference | ((prev: ThemePreference) => ThemePreference)) => void);
  resolvedTheme?: Theme;
  setResolvedTheme?: Mock | ((theme: Theme | ((prev: Theme) => Theme)) => void);
  layoutVariant?: LayoutVariant;
  setLayoutVariant?: Mock | ((variant: LayoutVariant | ((prev: LayoutVariant) => LayoutVariant)) => void);
  isCompactExpanded?: boolean;
  setIsCompactExpanded?: Mock | ((expanded: boolean | ((prev: boolean) => boolean)) => void);
  lastNonCompactVariant?: Exclude<LayoutVariant, 'compact'>;
  setLastNonCompactVariant?: Mock | ((variant: Exclude<LayoutVariant, 'compact'>) => void);
  activeLargeTab?: string;
  setActiveLargeTab?: Mock | ((tab: string) => void);
  textAndIconSize?: TextAndIconSize;
  setTextAndIconSize?: Mock | ((size: TextAndIconSize | ((prev: TextAndIconSize) => TextAndIconSize)) => void);
  engineState?: string;
  enginePID?: number | null;
  minimizeToTray?: boolean;
  setMinimizeToTray?: Mock | ((minimize: boolean | ((prev: boolean) => boolean)) => void);
  alwaysOnTopSmall?: boolean;
  setAlwaysOnTopSmall?: Mock | ((val: boolean | ((prev: boolean) => boolean)) => void);
  alwaysOnTopMain?: boolean;
  setAlwaysOnTopMain?: Mock | ((val: boolean | ((prev: boolean) => boolean)) => void);
  logToApi?: boolean;
  setLogToApi?: Mock | ((val: boolean | ((prev: boolean) => boolean)) => void);
  apiToken?: string;
  setApiToken?: Mock | ((token: string | ((prev: string) => string)) => void);
  apiUrl?: string;
  setApiUrl?: Mock | ((url: string | ((prev: string) => string)) => void);
  apiMethod?: string;
  setApiMethod?: Mock | ((method: string | ((prev: string) => string)) => void);
  apiHeaders?: string;
  setApiHeaders?: Mock | ((headers: string | ((prev: string) => string)) => void);
  nowIso?: string;
  setNowIso?: Mock | ((iso: string) => void);
  isGuiClosed?: boolean;
  setIsGuiClosed?: Mock | ((val: boolean | ((prev: boolean) => boolean)) => void);
  selectedTaskId?: string | null;
  setSelectedTaskId?: Mock | ((id: string | null | ((prev: string | null) => string | null)) => void);
  handleAddProject?: Mock | ((name: string, color: string) => Promise<unknown>);
  handleToggleProjectArchive?: Mock | ((id: string) => Promise<unknown>);
  handleAddTask?: Mock | ((projectId: string, name: string) => Promise<unknown>);
  handleRenameProject?: Mock | ((id: string, name: string) => Promise<unknown>);
  handleRenameTask?: Mock | ((id: string, name: string) => Promise<unknown>);
  handleUpdateProject?: Mock | ((id: string, name: string, color: string, archived: boolean, description?: string | null, icon?: string | null, tags?: string[] | null) => Promise<unknown>);
  handleUpdateTask?: Mock | ((taskId: string, name: string, parentTaskId: string | null, status: TaskStatus | null, completed: boolean | null) => Promise<unknown>);
  handleDeleteTask?: Mock | ((id: string) => Promise<unknown>);
  handleToggleTaskComplete?: Mock | ((id: string) => Promise<unknown>);
  handleStartTimer?: Mock | ((projectId: string, taskId: string) => Promise<unknown>);
  handleStopTimer?: Mock | (() => Promise<unknown>);
  handleEditTimeLog?: Mock | ((id: string, startTime: string, endTime: string | null, note: string | null) => Promise<unknown>);
  handleRestoreState?: Mock | ((payload: unknown) => Promise<unknown>);
  handleAddHoliday?: Mock | ((date: string, type: string, name: string) => Promise<unknown>);
  handleDeleteHoliday?: Mock | ((id: string) => Promise<unknown>);
  handleMinimizeToTray?: Mock | (() => Promise<void> | void);
  isMinimized?: boolean;
  setIsMinimized?: Mock | ((val: boolean) => void);
  activeTab?: 'gui' | 'cli' | 'rust';
  setActiveTab?: Mock | ((tab: 'gui' | 'cli' | 'rust') => void);
  trayNotification?: string | null;
  setTrayNotification?: Mock | ((val: string | null) => void);
  showToast?: Mock | ((message: string) => void);
}

export const getMockOxyFlowState = (): OxyFlowState => ({
  customTranslations: {},
  setCustomTranslations: vi.fn(),
  projects: [{ id: 'p1', name: 'Proj 1', color: 'red', createdAt: '2026', archived: false, description: null, icon: null, tags: null }],
  setProjects: vi.fn(),
  tasks: [{ id: 't1', projectId: 'p1', name: 'Task 1', completed: false, createdAt: '2026', status: null, parentTaskId: null }],
  setTasks: vi.fn(),
  logs: [{ id: 'l1', taskId: 't1', projectId: 'p1', startTime: '2026-06-15T12:00:00Z', endTime: null, note: null, editHistory: null }],
  setLogs: vi.fn(),
  holidays: [],
  setHolidays: vi.fn(),
  patches: [],
  setPatches: vi.fn(),
  sysSettings: { autoStart: false, autoPauseOnSleep: true, includePatchesInReports: false, activeSinks: [] },
  setSysSettings: vi.fn(),
  activeLog: null,
  setActiveLog: vi.fn(),
  localePref: 'system',
  setLocalePref: vi.fn(),
  locale: 'en',
  setLocale: vi.fn(),
  theme: 'dark',
  setTheme: vi.fn(),
  resolvedTheme: 'dark',
  setResolvedTheme: vi.fn(),
  layoutVariant: 'medium',
  setLayoutVariant: vi.fn(),
  isCompactExpanded: true,
  setIsCompactExpanded: vi.fn(),
  lastNonCompactVariant: 'full',
  setLastNonCompactVariant: vi.fn(),
  activeLargeTab: 'main',
  setActiveLargeTab: vi.fn(),
  textAndIconSize: 'medium',
  setTextAndIconSize: vi.fn(),
  engineState: 'connected',
  enginePID: 1234,
  minimizeToTray: false,
  setMinimizeToTray: vi.fn(),
  alwaysOnTopSmall: false,
  setAlwaysOnTopSmall: vi.fn(),
  alwaysOnTopMain: false,
  setAlwaysOnTopMain: vi.fn(),
  logToApi: false,
  setLogToApi: vi.fn(),
  apiToken: '123',
  setApiToken: vi.fn(),
  apiUrl: 'https://test-api.com',
  setApiUrl: vi.fn(),
  apiMethod: 'POST',
  setApiMethod: vi.fn(),
  apiHeaders: '{}',
  setApiHeaders: vi.fn(),
  nowIso: '2026-06-15T12:05:00Z',
  isGuiClosed: false,
  setIsGuiClosed: vi.fn(),
  selectedTaskId: null,
  setSelectedTaskId: vi.fn(),
  handleAddProject: vi.fn(),
  handleToggleProjectArchive: vi.fn(),
  handleAddTask: vi.fn(),
  handleRenameProject: vi.fn(),
  handleRenameTask: vi.fn(),
  handleUpdateProject: vi.fn(),
  handleUpdateTask: vi.fn(),
  handleDeleteTask: vi.fn(),
  handleToggleTaskComplete: vi.fn(),
  handleStartTimer: vi.fn(),
  handleStopTimer: vi.fn(),
  handleEditTimeLog: vi.fn(),
  handleRestoreState: vi.fn(),
  handleAddHoliday: vi.fn(),
  handleDeleteHoliday: vi.fn(),
  showToast: vi.fn(),
});

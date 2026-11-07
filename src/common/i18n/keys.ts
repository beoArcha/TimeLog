import type { AppKey } from './keys/app';
import type { CalendarKey } from './keys/calendar';
import type { CliKey } from './keys/cli';
import type { CommonKey } from './keys/common';
import type { DatabaseKey } from './keys/database';
import type { EngineKey } from './keys/engine';
import type { HelpKey } from './keys/help';
import type { ProjectKey } from './keys/project';
import type { ReportKey } from './keys/report';
import type { SettingsKey } from './keys/settings';
import type { TaskKey } from './keys/task';
import type { TimerKey } from './keys/timer';

export type {
  AppKey,
  CalendarKey,
  CliKey,
  CommonKey,
  DatabaseKey,
  EngineKey,
  HelpKey,
  ProjectKey,
  ReportKey,
  SettingsKey,
  TaskKey,
  TimerKey,
};

export interface DomainKeys {
  app: AppKey;
  calendar: CalendarKey;
  cli: CliKey;
  common: CommonKey;
  database: DatabaseKey;
  engine: EngineKey;
  help: HelpKey;
  project: ProjectKey;
  report: ReportKey;
  settings: SettingsKey;
  task: TaskKey;
  timer: TimerKey;
}

export const I18N_KEYS = {
  project: {
    DeleteProject: 'DeleteProject',
    ConfirmDeleteProjectTitle: 'ConfirmDeleteProjectTitle',
    DeleteProjectWarningTasks: 'DeleteProjectWarningTasks',
    CannotDeleteProjectWithTimeLogs: 'CannotDeleteProjectWithTimeLogs',
    CustomColorPicker: 'CustomColorPicker',
    TagSuggestionsLabel: 'TagSuggestionsLabel',
  },
  engine: {
    EnvironmentSqlite: 'EnvironmentSqlite',
    EnvironmentLocalStorage: 'EnvironmentLocalStorage',
    PwaOnlineReady: 'PwaOnlineReady',
    StatusConnecting: 'StatusConnecting',
    StatusDaemonRunning: 'StatusDaemonRunning',
  },
  common: {
    ERR_AUDIT_REASON_REQUIRED: 'ERR_AUDIT_REASON_REQUIRED',
    ERR_AUDIT_SOURCE_INVALID: 'ERR_AUDIT_SOURCE_INVALID',
    ERR_TIMELOG_INVALID_RANGE: 'ERR_TIMELOG_INVALID_RANGE',
  },
} as const;

export type I18nKeysContract = typeof I18N_KEYS;
export type I18nProjectKeys = typeof I18N_KEYS.project;
export type I18nEngineKeys = typeof I18N_KEYS.engine;
export type I18nCommonKeys = typeof I18N_KEYS.common;

export const I18N_DOMAINS = [
  'common',
  'app',
  'project',
  'task',
  'timer',
  'engine',
  'report',
  'database',
  'calendar',
  'settings',
  'cli',
  'help',
] as const satisfies readonly (keyof DomainKeys)[];

export type I18nDomain = (typeof I18N_DOMAINS)[number];

/**
 * Canonical navigation tab identifier for full window layout.
 */
export type AppTabId =
  | 'tasks'
  | 'reports'
  | 'db'
  | 'settings'
  | 'backup'
  | 'cli'
  | 'manual'
  | 'credits';

/**
 * Navigation tab identifier for medium window layout.
 */
export type MediumTabId = Extract<AppTabId, 'tasks' | 'reports' | 'settings'>;

export const APP_TAB_IDS: readonly AppTabId[] = [
  'tasks',
  'reports',
  'db',
  'settings',
  'backup',
  'cli',
  'manual',
  'credits',
] as const;

export const MEDIUM_TAB_IDS: readonly MediumTabId[] = [
  'tasks',
  'reports',
  'settings',
] as const;

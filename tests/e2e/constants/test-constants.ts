export const TEST_IDS = {
  PROJECT_ALPHA: 'proj-alpha-001',
  PROJECT_BETA: 'proj-beta-002',
  PROJECT_SEEDED: 'proj-seeded-999',
  PROJECT_COMPLETION: 'proj-comp-101',
  PROJECT_SUBTASKS: 'proj-sub-102',
  PROJECT_DELETION: 'proj-del-103',
  PROJECT_ARCHIVE: 'proj-arch-104',
  PROJECT_ANALYTICS: 'proj-analytics-301',
  PROJECT_RESILIENCE: 'proj-resilience-1',
  PROJECT_COMPACT: 'proj-compact-101',

  TASK_ALPHA: 'task-alpha-001',
  TASK_SEEDED: 'task-seeded-888',
  TASK_COMPLETION: 'task-comp-201',
  TASK_PARENT: 'task-parent-202',
  TASK_SUBTASK: 'task-sub-202-a',
  TASK_DELETION: 'task-del-203',
  TASK_ANALYTICS: 'task-analytics-401',
  TASK_RESILIENCE: 'task-resilience-1',
  TASK_COMPACT: 'task-compact-201',

  LOG_ANALYTICS: 'log-analytics-501',
} as const;

export const TEST_NAMES = {
  PROJECT_ALPHA: 'Alpha Project E2E',
  PROJECT_BETA: 'Beta Project E2E',
  PROJECT_SEEDED: 'Seeded Project E2E',
  PROJECT_COMPLETION: 'Completion Test Project',
  PROJECT_SUBTASKS: 'Subtasks Test Project',
  PROJECT_DELETION: 'Deletion Test Project',
  PROJECT_ARCHIVE: 'Archive Test Project',
  PROJECT_ANALYTICS: 'Analytics Test Project',
  PROJECT_RESILIENCE: 'Resilience Test Project',
  PROJECT_COMPACT: 'Compact Test Project',

  TASK_ALPHA: 'Alpha Main Task E2E',
  TASK_SEEDED: 'Seeded Task E2E',
  TASK_COMPLETION: 'Task To Complete',
  TASK_PARENT: 'Parent Task E2E',
  TASK_SUBTASK: 'Subtask Alpha E2E',
  TASK_DELETION: 'Task To Delete',
  TASK_ANALYTICS: 'Analytics Task',
  TASK_RESILIENCE: 'Continuous Measurement Task',
  TASK_COMPACT: 'Compact Task Alpha',

  DESCRIPTION_DEFAULT: 'Test project description for E2E validation',
} as const;

export const TEST_COLORS = {
  VIOLET: 'violet',
  ORANGE: 'orange',
  EMERALD: 'emerald',
  BLUE: 'blue',
  AMBER: 'amber',
  ROSE: 'rose',
} as const;

export const TEST_DATES = {
  STATIC_TIMESTAMP: '2026-07-12T12:00:00Z',
  LOG_START: '2026-07-12T10:00:00Z',
  LOG_END: '2026-07-12T11:30:00Z',
} as const;

export const TEST_LABELS = {
  START_MEASUREMENT: 'Start measurement',
  STOP_MEASUREMENT: 'Stop measurement',
} as const;

export const TEST_THEMES = {
  DARK: 'dark',
  LIGHT: 'light',
  HIGH_CONTRAST: 'high-contrast',
  SYSTEM: 'system',
} as const;

export const TEST_LOCALES = {
  EN: 'en',
  PL: 'pl',
  DE: 'de',
  ES: 'es',
  FR: 'fr',
  PT_BR: 'pt-br',
} as const;

export const LOCALE_REPORTS_LABELS: Record<string, string> = {
  en: 'Reports',
  pl: 'Raporty',
  de: 'Berichte',
  es: 'Informes',
  fr: 'Rapports',
  'pt-br': 'Relatórios',
} as const;



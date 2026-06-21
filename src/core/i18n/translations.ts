import { Locale } from '@bindings/Locale';
import { dictionaries } from './i18n';

export type LocaleType = Locale;

// TODO: refactoring dynamic group for translation
export interface TranslationDictionary {
  guiInterface: string;
  cliInterface: string;
  rustSource: string;
  searchingEngine: string;
  connectingSqlite: string;
  connectedDaemon: string;
  engineSynced: string;
  parallelThreads: string;
  minimizeToTray: string;
  sqlReset: string;
  newProject: string;
  addTask: string;
  addSubtask: string;
  projectName: string;
  dashboardTitle: string;
  tasksAndSubtasks: string;
  projectTotalTime: string;
  activeTracker: string;
  stopAllThreads: string;
  selectProject: string;
  noTasksInProject: string;
  cancel: string;
  save: string;
  taskName: string;
  addSubtaskTitle: string;
  addNewProject: string;
  enterProjectName: string;
  chooseProjectColor: string;
  enterMainTaskName: string;
  subtaskLabel: string;
  counterLabel: string;
  inProgressLabel: string;
  clearDatabaseConfirm: string;
  addLanguage: string;
  customLanguageTitle: string;
  customLanguageKey: string;
  keyLabel: string;
  valueLabel: string;
  saveCustomTranslation: string;
  testsTitle: string;
  runMockTests: string;
  howToCompileTitle: string;
  helpAndDocumentation: string;
  compileWizard: string;
  holidaysAndLeaves: string;
  addHolidayLeave: string;
  reportsTitle: string;
  periodReport: string;
}

const keyMap: Record<keyof TranslationDictionary, string> = {
  guiInterface: 'tabs.main',
  cliInterface: 'tabs.cli',
  rustSource: 'tabs.rust',
  searchingEngine: 'engine.searching',
  connectingSqlite: 'engine.connecting',
  connectedDaemon: 'engine.connected',
  engineSynced: 'engine.synced',
  parallelThreads: 'engine.threads',
  minimizeToTray: 'engine.minimizeToTray',
  sqlReset: 'engine.sqlReset',
  newProject: 'gui.newProject',
  addTask: 'gui.addTask',
  addSubtask: 'gui.addSubtask',
  projectName: 'gui.projectName',
  dashboardTitle: 'gui.dashboardTitle',
  tasksAndSubtasks: 'gui.tasksAndSubtasks',
  projectTotalTime: 'gui.projectTotalTime',
  activeTracker: 'gui.activeTracker',
  stopAllThreads: 'gui.stopAllThreads',
  selectProject: 'gui.selectProject',
  noTasksInProject: 'gui.noTasksInProject',
  cancel: 'common.cancel',
  save: 'common.save',
  taskName: 'gui.taskName',
  addSubtaskTitle: 'gui.addSubtaskTitle',
  addNewProject: 'gui.addNewProject',
  enterProjectName: 'gui.enterProjectName',
  chooseProjectColor: 'gui.chooseProjectColor',
  enterMainTaskName: 'gui.enterMainTaskName',
  subtaskLabel: 'gui.subtaskLabel',
  counterLabel: 'gui.counterLabel',
  inProgressLabel: 'gui.inProgressLabel',
  clearDatabaseConfirm: 'settings.clearDatabaseConfirm',
  addLanguage: 'settings.addLanguage',
  customLanguageTitle: 'settings.customLanguageTitle',
  customLanguageKey: 'settings.customLanguageKey',
  keyLabel: 'settings.keyLabel',
  valueLabel: 'settings.valueLabel',
  saveCustomTranslation: 'settings.saveCustomTranslation',
  testsTitle: 'tests.testsTitle',
  runMockTests: 'tests.runMockTests',
  howToCompileTitle: 'help.howToCompileTitle',
  helpAndDocumentation: 'help.helpAndDocumentation',
  compileWizard: 'help.compileWizard',
  holidaysAndLeaves: 'gui.holidaysAndLeaves',
  addHolidayLeave: 'gui.addHolidayLeave',
  reportsTitle: 'gui.reportsTitle',
  periodReport: 'gui.periodReport',
};

function getNestedValue(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

type DictionaryLocale = Exclude<LocaleType, 'custom' | 'system'>;

export const defaultTranslations: Record<DictionaryLocale, TranslationDictionary> = {
  pl: {} as TranslationDictionary,
  en: {} as TranslationDictionary,
  de: {} as TranslationDictionary,
  es: {} as TranslationDictionary,
  'pt-br': {} as TranslationDictionary,
  fr: {} as TranslationDictionary,
};

const locales = Object.keys(defaultTranslations) as DictionaryLocale[];

for (const locale of locales) {
  const dict = dictionaries[locale];
  const langObj = {} as Record<keyof TranslationDictionary, string>;
  for (const [flatKey, path] of Object.entries(keyMap)) {
    langObj[flatKey as keyof TranslationDictionary] = getNestedValue(dict, path) || getNestedValue(dictionaries.en, path) || '';
  }
  defaultTranslations[locale] = langObj as TranslationDictionary;
}

export const getTranslation = (
  locale: LocaleType,
  key: keyof TranslationDictionary,
  customDict?: Partial<TranslationDictionary>
): string | undefined => {
  if (locale === 'custom') {
    return customDict?.[key] || defaultTranslations['en']?.[key];
  }
  const typedLocale = locale as DictionaryLocale;
  return defaultTranslations[typedLocale]?.[key] || defaultTranslations['en']?.[key];
};

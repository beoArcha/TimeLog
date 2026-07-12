import { Locale } from '@bindings/Locale';
import { DomainKeys } from './keys';

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

import common from './dictionaries/common.json';
import app from './dictionaries/app.json';
import project from './dictionaries/project.json';
import task from './dictionaries/task.json';
import timer from './dictionaries/timer.json';
import engine from './dictionaries/engine.json';
import report from './dictionaries/report.json';
import database from './dictionaries/database.json';
import calendar from './dictionaries/calendar.json';
import settings from './dictionaries/settings.json';
import cli from './dictionaries/cli.json';
import help from './dictionaries/help.json';

export const dictionaries: Record<string, Record<string, Record<string, string>>> = {
  common,
  app,
  project,
  task,
  timer,
  engine,
  report,
  database,
  calendar,
  settings,
  cli,
  help,
};

const isDev =
  (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV);

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{\s*([^}]+?)\s*\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return trimmedKey in vars ? String(vars[trimmedKey]) : match;
  });
}

export function translate<D extends keyof DomainKeys>(
  locale: Locale,
  domain: D,
  key: DomainKeys[D],
  customDict?: Record<string, any> | undefined,
  vars?: Record<string, string | number>
): string {
  const domainDict = dictionaries[domain];
  if (!domainDict) {
    return key;
  }

  if (locale === 'custom' && customDict) {
    const customVal = customDict[domain]?.[key];
    if (typeof customVal === 'string') {
      return interpolate(customVal, vars);
    }
  }

  const resolvedLocale = locale === 'custom' ? 'en' : locale;
  const langDict = domainDict[resolvedLocale] || domainDict['en'];
  let translation = langDict?.[key];

  if (translation === undefined && resolvedLocale !== 'en') {
    translation = domainDict['en']?.[key];
  }

  if (translation !== undefined) {
    return interpolate(translation, vars);
  }

  if (isDev) {
    console.warn(`[i18n] Missing translation: ${domain}.${key}`);
  }

  return interpolate(key, vars);
}

import { useLocale } from '@common/hooks/LocaleProvider';

export function useTranslation<D extends keyof DomainKeys>(domain: D) {
  const { locale, customTranslations } = useLocale();
  return {
    t: (key: DomainKeys[D], vars?: Record<string, string | number>) => {
      return translate(locale, domain, key, customTranslations, vars);
    },
    locale,
  };
}

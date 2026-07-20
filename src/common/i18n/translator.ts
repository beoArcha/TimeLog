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

export type DomainTranslations = Record<string, Record<string, string>>;

function isDevelopmentEnv(): boolean {
  return (
    (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') ||
    (typeof import.meta !== 'undefined' &&
      Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV))
  );
}

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{\s*([^}]+?)\s*\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return trimmedKey in vars ? String(vars[trimmedKey]) : match;
  });
}

function resolveCustomTranslation(
  domain: string,
  key: string,
  customDict?: Record<string, unknown>
): string | undefined {
  if (!customDict) return undefined;
  const domainEntry = customDict[domain];
  if (domainEntry && typeof domainEntry === 'object') {
    const customVal = (domainEntry as Record<string, unknown>)[key];
    if (typeof customVal === 'string') {
      return customVal;
    }
  }
  return undefined;
}

function resolveDictionaryTranslation(
  domainDict: DomainTranslations,
  locale: Locale,
  key: string
): string | undefined {
  const resolvedLocale = locale === 'custom' ? 'en' : locale;
  const langDict = domainDict[resolvedLocale] || domainDict['en'];
  const translation = langDict?.[key];

  if (translation !== undefined) {
    return translation;
  }

  if (resolvedLocale !== 'en') {
    return domainDict['en']?.[key];
  }

  return undefined;
}

function logMissingTranslation(domain: string, key: string): void {
  if (isDevelopmentEnv()) {
    console.warn(`[i18n] Missing translation: ${domain}.${key}`);
  }
}

export function translate<D extends keyof DomainKeys>(
  locale: Locale,
  domain: D,
  key: DomainKeys[D],
  customDict?: Record<string, unknown> | undefined,
  vars?: Record<string, string | number>
): string {
  const domainDict = dictionaries[domain] as DomainTranslations | undefined;
  if (!domainDict) {
    return interpolate(key, vars);
  }

  if (locale === 'custom' && customDict) {
    const customVal = resolveCustomTranslation(domain, key, customDict);
    if (customVal !== undefined) {
      return interpolate(customVal, vars);
    }
  }

  const translation = resolveDictionaryTranslation(domainDict, locale, key);
  if (translation !== undefined) {
    return interpolate(translation, vars);
  }

  logMissingTranslation(domain, key);
  return interpolate(key, vars);
}

import { useLocale } from '@common/hooks/LocaleProvider';

export function useTranslation<D extends keyof DomainKeys>(domain: D) {
  let locale: Locale = 'en';
  let customTranslations: Partial<TranslationDictionary> | undefined = undefined;
  try {
    const ctx = useLocale();
    locale = ctx.locale;
    customTranslations = ctx.customTranslations;
  } catch {
    // Fallback if rendered outside LocaleProvider (e.g. isolated unit tests)
  }
  return {
    t: (key: DomainKeys[D], vars?: Record<string, string | number>) => {
      return translate(locale, domain, key, customTranslations, vars);
    },
    locale,
  };
}

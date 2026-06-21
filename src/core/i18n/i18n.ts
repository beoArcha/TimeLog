import { Locale } from '@bindings/Locale';

export type LocaleType = Locale;

export interface TranslationDictionary {
  [key: string]: string | TranslationDictionary;
}

import { en } from './dictionaries/en';
import { pl } from './dictionaries/pl';
import { de } from './dictionaries/de';
import { es } from './dictionaries/es';
import { ptBr } from './dictionaries/pt-br';
import { fr } from './dictionaries/fr';

import { AppKey } from './keys/AppKey';
import { BackupKey } from './keys/BackupKey';
import { CommonKey } from './keys/CommonKey';
import { CreditsKey } from './keys/CreditsKey';
import { DbExplorerKey } from './keys/DbExplorerKey';
import { EngineKey } from './keys/EngineKey';
import { GuiKey } from './keys/GuiKey';
import { HelpKey } from './keys/HelpKey';
import { ManualKey } from './keys/ManualKey';
import { RustExplorerKey } from './keys/RustExplorerKey';
import { SettingsKey } from './keys/SettingsKey';
import { SmallGuiKey } from './keys/SmallGuiKey';
import { TabKey } from './keys/TabKey';
import { TestKey } from './keys/TestKey';
import { ThemeKey } from './keys/ThemeKey';
import { TrayKey } from './keys/TrayKey';

export type TranslationKey =
  | AppKey
  | BackupKey
  | CommonKey
  | CreditsKey
  | DbExplorerKey
  | EngineKey
  | GuiKey
  | HelpKey
  | ManualKey
  | RustExplorerKey
  | SettingsKey
  | SmallGuiKey
  | TabKey
  | TestKey
  | ThemeKey
  | TrayKey
  | string;
export type EnumKey = Exclude<TranslationKey, string>;
export const dictionaries = { en, pl, de, es, 'pt-br': ptBr, fr };

const isDev =
  (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV);

export function translate(
  locale: LocaleType,
  keyPath: string,
  customDict?: unknown,
): string;

export function translate(
  locale: LocaleType,
  keyPath: EnumKey,
  customDict?: unknown,
): string;

export function translate(
  locale: LocaleType,
  keyPath: string | TranslationKey,
  customDict?: unknown,
): string {
  const keys = keyPath.split('.');
  let current: any = dictionaries[locale] || dictionaries.en;

  if (locale === 'custom' && customDict) {
    let tempCustom = customDict;
    for (const k of keys) tempCustom = tempCustom?.[k];
    if (typeof tempCustom === 'string') return tempCustom;
  }

  for (const k of keys) {
    if (!current) break;
    current = current[k as keyof typeof current];
  }

  if (typeof current === 'string') {
    return current;
  }

  current = dictionaries.en;
  for (const k of keys) {
    if (!current) break;
    current = (current as any)[k];
  }

  if (typeof current === 'string') {
    return current;
  }

  if (isDev) {
    console.warn(`[i18n] Missing translation: ${keyPath}`);
  }

  return keyPath;
}

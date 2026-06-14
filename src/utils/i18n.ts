import { LocaleType } from './translations';
import { en } from './i18n/en';
import { pl } from './i18n/pl';
import { de } from './i18n/de';
import { es } from './i18n/es';
import { ptBr } from './i18n/pt-br';
import { fr } from './i18n/fr';

export const dictionaries = { en, pl, de, es, 'pt-br': ptBr, fr };

export function translate(locale: LocaleType, keyPath: string, customDict?: any): string {
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
  
  // Fallback to English
  current = dictionaries.en;
  for (const k of keys) {
    if (!current) return keyPath; // Missing translation fallback
    current = (current as any)[k];
  }
  return typeof current === 'string' ? current : keyPath;
}

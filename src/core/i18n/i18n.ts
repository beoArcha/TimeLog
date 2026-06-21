import { LocaleType } from './translations';
import { en } from './dictionaries/en';
import { pl } from './dictionaries/pl';
import { de } from './dictionaries/de';
import { es } from './dictionaries/es';
import { ptBr } from './dictionaries/pt-br';
import { fr } from './dictionaries/fr';

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

  current = dictionaries.en;
  for (const k of keys) {
    if (!current) return keyPath;
    current = (current as any)[k];
  }
  return typeof current === 'string' ? current : keyPath;
}

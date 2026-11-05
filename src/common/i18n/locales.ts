import type { Locale } from '@bindings/Locale';

export interface LocaleInfo {
  code: Locale;
  nativeName: string;
  englishName: string;
  region?: string;
}

export const STANDARD_LOCALES = [
  'en',
  'pl',
  'de',
  'es',
  'pt-br',
  'fr',
  'uk',
  'ja',
  'nl',
  'it',
] as const satisfies readonly Locale[];

export const SUPPORTED_LOCALES = [
  'en',
  'pl',
  'de',
  'es',
  'pt-br',
  'fr',
  'uk',
  'ja',
  'nl',
  'it',
  'system',
] as const satisfies readonly Locale[];

/**
 * Resolves a system / browser language tag to a supported standard Locale.
 * Falls back to 'en' when the language tag does not match any supported locale.
 */
export function resolveSystemLocale(navLang?: string): Locale {
  const browserLang = (
    navLang ??
    (typeof navigator !== 'undefined' ? navigator.language : 'en')
  ).toLowerCase();

  if (browserLang.startsWith('pl')) return 'pl';
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('pt')) return 'pt-br';
  if (browserLang.startsWith('fr')) return 'fr';
  if (browserLang.startsWith('uk')) return 'uk';
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('nl')) return 'nl';
  if (browserLang.startsWith('it')) return 'it';
  return 'en';
}

export const LOCALE_METADATA: Record<Locale, LocaleInfo> = {
  en: { code: 'en', nativeName: 'English', englishName: 'English', region: 'US/UK' },
  pl: { code: 'pl', nativeName: 'Polski', englishName: 'Polish', region: 'Polska' },
  de: { code: 'de', nativeName: 'Deutsch', englishName: 'German', region: 'Deutschland' },
  es: { code: 'es', nativeName: 'Español', englishName: 'Spanish', region: 'España' },
  'pt-br': { code: 'pt-br', nativeName: 'Português (Brasil)', englishName: 'Portuguese (Brazil)', region: 'Brasil' },
  fr: { code: 'fr', nativeName: 'Français', englishName: 'French', region: 'France' },
  uk: { code: 'uk', nativeName: 'Українська', englishName: 'Ukrainian', region: 'Україна' },
  ja: { code: 'ja', nativeName: '日本語', englishName: 'Japanese', region: '日本' },
  nl: { code: 'nl', nativeName: 'Nederlands', englishName: 'Dutch', region: 'Nederland' },
  it: { code: 'it', nativeName: 'Italiano', englishName: 'Italian', region: 'Italia' },
  system: { code: 'system', nativeName: 'System default', englishName: 'System default' },
  custom: { code: 'custom', nativeName: 'Custom', englishName: 'Custom override' },
};


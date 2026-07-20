/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { TranslationDictionary } from '@common/i18n/translator';
import { STORAGE_KEYS } from '@common/constants';
import { Locale } from '@/src/bindings/Locale';

interface LocaleContextProps {
  localePref: Locale;
  setLocalePref: React.Dispatch<React.SetStateAction<Locale>>;
  locale: Locale;
  setLocale: React.Dispatch<React.SetStateAction<Locale>>;
  customTranslations: Partial<TranslationDictionary>;
  setCustomTranslations: React.Dispatch<React.SetStateAction<Partial<TranslationDictionary>>>;
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

function resolveSystemLocale(): Locale {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('pl')) return 'pl';
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('pt')) return 'pt-br';
  if (browserLang.startsWith('fr')) return 'fr';
  return 'en';
}

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localePref, setLocalePref] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCALE_PREF);
    if (saved) return saved as Locale;
    return 'system';
  });

  const [localeOverride, setLocaleOverride] = useState<[Locale, Locale] | null>(null);

  const locale = useMemo<Locale>(() => {
    if (localeOverride !== null && localeOverride[0] === localePref) return localeOverride[1];
    return localePref === 'system' ? resolveSystemLocale() : localePref;
  }, [localePref, localeOverride]);

  const setLocale: React.Dispatch<React.SetStateAction<Locale>> = (value) => {
    setLocaleOverride((prev) => {
      const current = prev !== null && prev[0] === localePref ? prev[1] : (localePref === 'system' ? resolveSystemLocale() : localePref);
      const next = typeof value === 'function' ? (value as (p: Locale) => Locale)(current) : value;
      return [localePref, next];
    });
  };

  const [customTranslations, setCustomTranslations] = useState<Partial<TranslationDictionary>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.warn(err);
      }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCALE_PREF, localePref);
  }, [localePref]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOCALE, locale);
  }, [locale]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_TRANSLATIONS, JSON.stringify(customTranslations));
  }, [customTranslations]);

  return (
    <LocaleContext.Provider value={{ localePref, setLocalePref, locale, setLocale, customTranslations, setCustomTranslations }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return {
      localePref: 'en' as Locale,
      setLocalePref: () => {},
      locale: 'en' as Locale,
      setLocale: () => {},
      customTranslations: {},
      setCustomTranslations: () => {},
    };
  }
  return ctx;
};

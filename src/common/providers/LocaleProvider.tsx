import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { LocaleType, TranslationDictionary } from '@core/i18n/i18n';
import { STORAGE_KEYS } from '@common/constants';

interface LocaleContextProps {
  localePref: LocaleType;
  setLocalePref: React.Dispatch<React.SetStateAction<LocaleType>>;
  locale: LocaleType;
  setLocale: React.Dispatch<React.SetStateAction<LocaleType>>;
  customTranslations: Partial<TranslationDictionary>;
  setCustomTranslations: React.Dispatch<React.SetStateAction<Partial<TranslationDictionary>>>;
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

function resolveSystemLocale(): LocaleType {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith('pl')) return 'pl';
  if (browserLang.startsWith('de')) return 'de';
  if (browserLang.startsWith('es')) return 'es';
  if (browserLang.startsWith('pt')) return 'pt-br';
  if (browserLang.startsWith('fr')) return 'fr';
  return 'en';
}

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localePref, setLocalePref] = useState<LocaleType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCALE_PREF);
    if (saved) return saved as LocaleType;
    return 'system';
  });

  const [localeOverride, setLocaleOverride] = useState<[LocaleType, LocaleType] | null>(null);

  const locale = useMemo<LocaleType>(() => {
    if (localeOverride !== null && localeOverride[0] === localePref) return localeOverride[1];
    return localePref === 'system' ? resolveSystemLocale() : localePref;
  }, [localePref, localeOverride]);

  const setLocale: React.Dispatch<React.SetStateAction<LocaleType>> = (value) => {
    setLocaleOverride((prev) => {
      const current = prev !== null && prev[0] === localePref ? prev[1] : (localePref === 'system' ? resolveSystemLocale() : localePref);
      const next = typeof value === 'function' ? (value as (p: LocaleType) => LocaleType)(current) : value;
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
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
};

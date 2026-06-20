import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocaleType, TranslationDictionary } from '../utils/translations';
import { STORAGE_KEYS } from '../common/constants';

interface LocaleContextProps {
  localePref: LocaleType;
  setLocalePref: React.Dispatch<React.SetStateAction<LocaleType>>;
  locale: LocaleType;
  setLocale: React.Dispatch<React.SetStateAction<LocaleType>>;
  customTranslations: Partial<TranslationDictionary>;
  setCustomTranslations: React.Dispatch<React.SetStateAction<Partial<TranslationDictionary>>>;
}

const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [localePref, setLocalePref] = useState<LocaleType>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOCALE_PREF);
    if (saved) return saved as LocaleType;
    return 'system';
  });

  const [locale, setLocale] = useState<LocaleType>('en');

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
    if (localePref === 'system') {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('pl')) setLocale('pl');
      else if (browserLang.startsWith('de')) setLocale('de');
      else if (browserLang.startsWith('es')) setLocale('es');
      else if (browserLang.startsWith('pt')) setLocale('pt-br');
      else if (browserLang.startsWith('fr')) setLocale('fr');
      else setLocale('en');
    } else {
      setLocale(localePref);
    }
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

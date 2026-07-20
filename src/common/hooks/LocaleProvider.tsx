/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ContextException } from '../exceptions';
import { TranslationDictionary } from '@common/i18n/translator';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { ErrorHandler } from '../exceptions';
import { Locale } from '@/src/bindings/Locale';

interface LocaleContextProps {
  localePref: Locale;
  setLocalePref: React.Dispatch<React.SetStateAction<Locale>>;
  locale: Locale;
  setLocale: React.Dispatch<React.SetStateAction<Locale>>;
  customTranslations: Partial<TranslationDictionary>;
  setCustomTranslations: React.Dispatch<React.SetStateAction<Partial<TranslationDictionary>>>;
}

export const LocaleContext = createContext<LocaleContextProps | undefined>(undefined);

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
  const [localePref, setLocalePref] = useState<Locale>('system');
  const [loaded, setLoaded] = useState(false);

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

  const [customTranslations, setCustomTranslations] = useState<Partial<TranslationDictionary>>({});

  useEffect(() => {
    Promise.all([
      PersistenceRouter.getInstance().locale.getLocalePref(),
      PersistenceRouter.getInstance().locale.getLocale(),
      PersistenceRouter.getInstance().locale.getCustomTranslations(),
    ]).then(([pref, _loc, trans]) => {
      setLocalePref((pref as Locale) || 'system');
      setCustomTranslations(trans);
      setLoaded(true);
    }).catch(ErrorHandler.handle);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    PersistenceRouter.getInstance().locale.saveLocalePref(localePref).catch(ErrorHandler.handle);
  }, [localePref, loaded]);

  useEffect(() => {
    if (!loaded) return;
    PersistenceRouter.getInstance().locale.saveLocale(locale).catch(ErrorHandler.handle);
  }, [locale, loaded]);

  useEffect(() => {
    if (!loaded) return;
    PersistenceRouter.getInstance().locale.saveCustomTranslations(customTranslations as Record<string, Record<string, string>>).catch(ErrorHandler.handle);
  }, [customTranslations, loaded]);

  return (
    <LocaleContext.Provider value={{ localePref, setLocalePref, locale, setLocale, customTranslations, setCustomTranslations }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new ContextException('useLocale must be used within LocaleProvider', 'ERR_LOCALE_CONTEXT');
  return ctx;
};

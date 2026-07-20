import React, { createContext, useContext } from 'react';
import { useAppSettings } from './useAppSettings';
import { useExternalApiSync } from './useExternalApiSync';
import { ContextException } from '../exceptions';

export type SettingsState = ReturnType<typeof useAppSettings> & ReturnType<typeof useExternalApiSync>;

export const SettingsContext = createContext<SettingsState | undefined>(undefined);

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new ContextException('useSettings must be used within SettingsProvider', 'ERR_SETTINGS_CONTEXT');
  return ctx;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appSettings = useAppSettings();
  const apiSync = useExternalApiSync();
  const state = { ...appSettings, ...apiSync };
  return <SettingsContext.Provider value={state}>{children}</SettingsContext.Provider>;
};

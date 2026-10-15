import React from 'react';
import { useAppSettings } from './useAppSettings';
import { useExternalApiSync } from './useExternalApiSync';
import { SettingsContext } from './SettingsContext';

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const appSettings = useAppSettings();
  const apiSync = useExternalApiSync();
  const state = { ...appSettings, ...apiSync };
  return <SettingsContext.Provider value={state}>{children}</SettingsContext.Provider>;
};

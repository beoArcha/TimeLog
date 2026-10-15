import React from 'react';
import { DataContext } from './DataContext';
import { useTimeLogData } from './useTimeLogData';
import { useSettings } from './SettingsContext';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pushToApi } = useSettings();
  const state = useTimeLogData(pushToApi);
  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
};

import React, { createContext, useContext } from 'react';
import { useTimeLogData } from './useTimeLogData';
import { useSettings } from './SettingsContext';
import { ContextException } from '../exceptions';

export type DataState = ReturnType<typeof useTimeLogData>;

export const DataContext = createContext<DataState | undefined>(undefined);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new ContextException('useData must be used within DataProvider', 'ERR_DATA_CONTEXT');
  return ctx;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pushToApi } = useSettings();
  const state = useTimeLogData(pushToApi);
  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
};

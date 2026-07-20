import React from 'react';
import { LocaleContext } from '@common/hooks/LocaleProvider';
import { SettingsContext } from '@common/hooks/SettingsContext';
import { DataContext } from '@common/hooks/DataContext';
import { EngineContext } from '@common/hooks/EngineContext';

export const MockProviders: React.FC<{ state: any, children: React.ReactNode }> = ({ state, children }) => {
  return (
    <LocaleContext.Provider value={state}>
      <SettingsContext.Provider value={state}>
        <DataContext.Provider value={state}>
          <EngineContext.Provider value={state}>
            {children}
          </EngineContext.Provider>
        </DataContext.Provider>
      </SettingsContext.Provider>
    </LocaleContext.Provider>
  );
};

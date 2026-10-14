import React from 'react';
import { LocaleContext } from '@common/hooks/LocaleProvider';
import { SettingsContext } from '@common/hooks/SettingsContext';
import { DataContext } from '@common/hooks/DataContext';
import { WindowShellContext } from '@common/contexts/WindowShellContext';

export const MockProviders: React.FC<{ state: any, children: React.ReactNode }> = ({ state, children }) => {
  return (
    <LocaleContext.Provider value={state}>
      <SettingsContext.Provider value={state}>
        <DataContext.Provider value={state}>
          <WindowShellContext.Provider value={state}>
            {children}
          </WindowShellContext.Provider>
        </DataContext.Provider>
      </SettingsContext.Provider>
    </LocaleContext.Provider>
  );
};

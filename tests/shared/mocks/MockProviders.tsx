import React from 'react';
import { LocaleContext } from '@common/hooks/LocaleProvider';
import { SettingsContext, SettingsState } from '@common/hooks/SettingsContext';
import { DataContext, DataState } from '@common/hooks/DataContext';
import { WindowShellContext, WindowShellState } from '@common/contexts/WindowShellContext';
import { OxyFlowState } from './oxy-state-mock';

type LocaleContextType = React.ContextType<typeof LocaleContext>;

export const MockProviders: React.FC<{ state?: OxyFlowState; children: React.ReactNode }> = ({ state = {}, children }) => {
  return (
    <LocaleContext.Provider value={state as unknown as LocaleContextType}>
      <SettingsContext.Provider value={state as unknown as SettingsState}>
        <DataContext.Provider value={state as unknown as DataState}>
          <WindowShellContext.Provider value={state as unknown as WindowShellState}>
            {children}
          </WindowShellContext.Provider>
        </DataContext.Provider>
      </SettingsContext.Provider>
    </LocaleContext.Provider>
  );
};

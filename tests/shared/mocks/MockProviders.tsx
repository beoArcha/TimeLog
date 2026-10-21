import React from 'react';
import { LocaleContext } from '@common/hooks/LocaleProvider';
import { SettingsContext, SettingsState } from '@common/hooks/SettingsContext';
import { DataContext, DataState } from '@common/hooks/DataContext';
import { WindowShellContext, WindowShellState } from '@common/contexts/WindowShellContext';
import { OxyFlowState, getMockOxyFlowState } from './oxy-state-mock';

import { CliSessionProvider } from '@features/cli/context/CliSessionProvider';

type LocaleContextType = React.ContextType<typeof LocaleContext>;

export interface MockProvidersProps {
  state?: OxyFlowState;
  dataState?: Partial<DataState>;
  settingsState?: Partial<SettingsState>;
  windowShellState?: Partial<WindowShellState>;
  localeState?: Partial<LocaleContextType>;
  children: React.ReactNode;
}

export const MockDataProvider: React.FC<{ value?: Partial<DataState>; children: React.ReactNode }> = ({ value, children }) => (
  <DataContext.Provider value={value as unknown as DataState}>
    {children}
  </DataContext.Provider>
);

export const MockSettingsProvider: React.FC<{ value?: Partial<SettingsState>; children: React.ReactNode }> = ({ value, children }) => (
  <SettingsContext.Provider value={value as unknown as SettingsState}>
    {children}
  </SettingsContext.Provider>
);

export const MockWindowShellProvider: React.FC<{ value?: Partial<WindowShellState>; children: React.ReactNode }> = ({ value, children }) => (
  <WindowShellContext.Provider value={value as unknown as WindowShellState}>
    {children}
  </WindowShellContext.Provider>
);

export const MockLocaleProvider: React.FC<{ value?: Partial<LocaleContextType>; children: React.ReactNode }> = ({ value, children }) => (
  <LocaleContext.Provider value={value as unknown as LocaleContextType}>
    {children}
  </LocaleContext.Provider>
);

export const MockProviders: React.FC<MockProvidersProps> = ({
  state,
  dataState,
  settingsState,
  windowShellState,
  localeState,
  children,
}) => {
  const merged = state ?? getMockOxyFlowState();
  const effectiveData = dataState ? { ...merged, ...dataState } : merged;
  const effectiveSettings = settingsState ? { ...merged, ...settingsState } : merged;
  const effectiveWindow = windowShellState ? { ...merged, ...windowShellState } : merged;
  const effectiveLocale = localeState ? { ...merged, ...localeState } : merged;

  return (
    <LocaleContext.Provider value={effectiveLocale as unknown as LocaleContextType}>
      <SettingsContext.Provider value={effectiveSettings as unknown as SettingsState}>
        <DataContext.Provider value={effectiveData as unknown as DataState}>
          <WindowShellContext.Provider value={effectiveWindow as unknown as WindowShellState}>
            <CliSessionProvider>
              {children}
            </CliSessionProvider>
          </WindowShellContext.Provider>
        </DataContext.Provider>
      </SettingsContext.Provider>
    </LocaleContext.Provider>
  );
};

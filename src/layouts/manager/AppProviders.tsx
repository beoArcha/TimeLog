import React from 'react';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { SettingsProvider } from '@common/hooks/SettingsContext';
import { DataProvider } from '@common/hooks/DataContext';
import { EngineProvider } from '@common/hooks/EngineContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <LocaleProvider>
      <SettingsProvider>
        <DataProvider>
          <EngineProvider>
            {children}
          </EngineProvider>
        </DataProvider>
      </SettingsProvider>
    </LocaleProvider>
  );
}

import React from 'react';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { SettingsProvider } from '@common/hooks/SettingsContext';
import { DataProvider } from '@common/hooks/DataContext';
import { WindowShellProvider } from '@common/contexts/WindowShellContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <LocaleProvider>
      <SettingsProvider>
        <DataProvider>
          <WindowShellProvider>
            {children}
          </WindowShellProvider>
        </DataProvider>
      </SettingsProvider>
    </LocaleProvider>
  );
}

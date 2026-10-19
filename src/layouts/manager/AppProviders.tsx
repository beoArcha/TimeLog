import React from 'react';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { SettingsProvider } from '@common/hooks/SettingsProvider';
import { DataProvider } from '@common/hooks/DataProvider';
import { WindowShellProvider } from '@common/contexts/WindowShellProvider';
import { CliSessionProvider } from '@features/cli/context/CliSessionProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <LocaleProvider>
      <SettingsProvider>
        <DataProvider>
          <WindowShellProvider>
            <CliSessionProvider>
              {children}
            </CliSessionProvider>
          </WindowShellProvider>
        </DataProvider>
      </SettingsProvider>
    </LocaleProvider>
  );
}

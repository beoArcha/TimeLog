import React from 'react';
import { LocaleProvider } from '@core/providers/LocaleProvider';
import { OxyProvider } from '@core/providers/OxyContext';

interface AppProvidersProps {
  children: React.ReactNode;
}

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <LocaleProvider>
      <OxyProvider>
        {children}
      </OxyProvider>
    </LocaleProvider>
  );
}

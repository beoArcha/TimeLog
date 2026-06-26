import React from 'react';
import { LocaleProvider } from '@common/providers/LocaleProvider';
import { OxyProvider } from '@common/providers/OxyContext';

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

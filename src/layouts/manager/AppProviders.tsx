import React from 'react';
import { LocaleProvider } from '@common/hooks/LocaleProvider';
import { OxyProvider } from '@common/hooks/OxyContext';

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

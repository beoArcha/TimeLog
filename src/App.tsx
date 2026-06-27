import React from 'react';
import AppProviders from '@layouts/manager/AppProviders';
import GuiManager from '@layouts/manager/GuiManager';

export default function App() {
  return (
    <AppProviders>
      <GuiManager />
    </AppProviders>
  );
}

import React from 'react';
import AppProviders from './layout/manager/AppProviders';
import GuiManager from './layout/manager/GuiManager';

export default function App() {
  return (
    <AppProviders>
      <GuiManager />
    </AppProviders>
  );
}

import React from 'react';
import AppProviders from './gui/manager/AppProviders';
import GuiManager from './gui/manager/GuiManager';

export default function App() {
  return (
    <AppProviders>
      <GuiManager />
    </AppProviders>
  );
}

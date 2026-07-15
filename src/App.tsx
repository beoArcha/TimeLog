import React from 'react';
import { isDesktopEnvironment } from '@common/utils/environment';
import AppBrowser from './app-browser/AppBrowser';
import AppTauri from './app-tauri/AppTauri';

export default function App() {
  if (isDesktopEnvironment()) {
    return <AppTauri />;
  }
  return <AppBrowser />;
}


import React from 'react';
import { MotionConfig } from 'motion/react';
import { isDesktopEnvironment } from '@common/utils/environment';
import AppBrowser from '@app-browser/AppBrowser';
import AppTauri from '@app-tauri/AppTauri';

export default function App() {
  const content = isDesktopEnvironment() ? <AppTauri /> : <AppBrowser />;

  return (
    <MotionConfig reducedMotion="user">
      {content}
    </MotionConfig>
  );
}


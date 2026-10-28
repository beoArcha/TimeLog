import React from 'react';
import LayoutManager from '@layouts/manager/LayoutManager';
import { PlatformCapabilitiesProvider } from '@common/contexts/PlatformCapabilitiesProvider';

export default function AppBrowser() {
  return (
    <PlatformCapabilitiesProvider
      capabilities={{
        dragRegionProps: {},
        canInspectDatabase: false,
        supportedLayouts: ['medium', 'full'],
        defaultLayout: 'full',
        supportsTray: false,
        supportsAlwaysOnTop: false,
        supportsAutoStart: false,
        isPwaInstallable: true,
      }}
    >
      <LayoutManager runtime="browser" />
    </PlatformCapabilitiesProvider>
  );
}

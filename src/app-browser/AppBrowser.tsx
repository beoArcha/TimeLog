import React, { useMemo } from 'react';
import LayoutManager from '@layouts/manager/LayoutManager';
import { PlatformCapabilitiesProvider } from '@common/contexts/PlatformCapabilitiesProvider';
import { PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

export default function AppBrowser() {
  const capabilities: PlatformCapabilities = useMemo(
    () => ({
      dragRegionProps: {},
      canInspectDatabase: false,
      supportedLayouts: ['medium', 'full'],
      defaultLayout: 'full',
      supportsTray: false,
      supportsAlwaysOnTop: false,
      supportsAutoStart: false,
      isPwaInstallable: true,
      hasNativeDaemon: false,
      canUseCli:
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('debug') === '1',
      storageEngineName: 'localStorage',
    }),
    []
  );

  return (
    <PlatformCapabilitiesProvider capabilities={capabilities}>
      <LayoutManager runtime="browser" />
    </PlatformCapabilitiesProvider>
  );
}

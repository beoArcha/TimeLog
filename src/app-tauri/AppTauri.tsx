import React, { useMemo } from 'react';
import LayoutManager from '@layouts/manager/LayoutManager';
import { PlatformCapabilitiesProvider } from '@common/contexts/PlatformCapabilitiesProvider';
import { PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

export default function AppTauri() {
  const capabilities: PlatformCapabilities = useMemo(
    () => ({
      dragRegionProps: { 'data-tauri-drag-region': true },
      canInspectDatabase: Boolean(import.meta.env.DEV),
      supportedLayouts: ['compact', 'medium', 'full'],
      defaultLayout: 'full',
      supportsTray: true,
      supportsAlwaysOnTop: true,
      supportsAutoStart: true,
      isPwaInstallable: false,
      hasNativeDaemon: true,
      canUseCli: true,
      storageEngineName: 'sqlite',
    }),
    []
  );

  return (
    <PlatformCapabilitiesProvider capabilities={capabilities}>
      <LayoutManager runtime="tauri" />
    </PlatformCapabilitiesProvider>
  );
}

import React from 'react';
import LayoutManager from '@layouts/manager/LayoutManager';
import { PlatformCapabilitiesProvider } from '@common/contexts/PlatformCapabilitiesContext';

export default function AppTauri() {
  return (
    <PlatformCapabilitiesProvider capabilities={{ dragRegionProps: { 'data-tauri-drag-region': true } }}>
      <LayoutManager runtime="tauri" />
    </PlatformCapabilitiesProvider>
  );
}

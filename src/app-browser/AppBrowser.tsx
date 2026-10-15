import React from 'react';
import LayoutManager from '@layouts/manager/LayoutManager';
import { PlatformCapabilitiesProvider } from '@common/contexts/PlatformCapabilitiesProvider';

export default function AppBrowser() {
  return (
    <PlatformCapabilitiesProvider capabilities={{ dragRegionProps: {} }}>
      <LayoutManager runtime="browser" />
    </PlatformCapabilitiesProvider>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import LayoutManager from '@layouts/manager/LayoutManager';
import { PlatformCapabilitiesProvider } from '@common/contexts/PlatformCapabilitiesProvider';
import { PlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

const MOBILE_VIEWPORT_QUERY = '(max-width: 767px)';

function getInitialIsMobileViewport(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
}

export default function AppBrowser() {
  const [isMobileViewport, setIsMobileViewport] = useState<boolean>(getInitialIsMobileViewport);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }
    const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const capabilities: PlatformCapabilities = useMemo(
    () => ({
      dragRegionProps: {},
      canInspectDatabase: false,
      supportedLayouts: isMobileViewport ? ['medium'] : ['medium', 'full'],
      defaultLayout: isMobileViewport ? 'medium' : 'full',
      supportsTray: false,
      supportsAlwaysOnTop: false,
      supportsAutoStart: false,
      isPwaInstallable: true,
      hasNativeDaemon: false,
      canUseCli:
        typeof window !== 'undefined' &&
        new URLSearchParams(window.location.search).get('debug') === '1',
      storageEngineName: 'localStorage',
      isDesktop: false,
    }),
    [isMobileViewport]
  );

  return (
    <PlatformCapabilitiesProvider capabilities={capabilities}>
      <LayoutManager runtime="browser" />
    </PlatformCapabilitiesProvider>
  );
}

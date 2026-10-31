import { createContext, useContext } from 'react';
import { LayoutVariant } from '@bindings/LayoutVariant';

export interface PlatformCapabilities {
  dragRegionProps: Record<string, unknown>;
  canInspectDatabase: boolean;
  supportedLayouts: LayoutVariant[];
  defaultLayout: LayoutVariant;
  supportsTray: boolean;
  supportsAlwaysOnTop: boolean;
  supportsAutoStart: boolean;
  isPwaInstallable: boolean;
  hasNativeDaemon?: boolean;
  canUseCli?: boolean;
  storageEngineName?: 'sqlite' | 'localStorage';
}

const defaultCapabilities: PlatformCapabilities = {
  dragRegionProps: {},
  canInspectDatabase: false,
  supportedLayouts: ['compact', 'medium', 'full'],
  defaultLayout: 'full',
  supportsTray: false,
  supportsAlwaysOnTop: false,
  supportsAutoStart: false,
  isPwaInstallable: false,
  hasNativeDaemon: false,
  canUseCli: false,
  storageEngineName: 'localStorage',
};

export const PlatformCapabilitiesContext = createContext<PlatformCapabilities>(defaultCapabilities);

export const usePlatformCapabilities = (): PlatformCapabilities => useContext(PlatformCapabilitiesContext);

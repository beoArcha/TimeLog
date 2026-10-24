import { createContext, useContext } from 'react';

export interface PlatformCapabilities {
  dragRegionProps: Record<string, unknown>;
  canInspectDatabase: boolean;
}

const defaultCapabilities: PlatformCapabilities = {
  dragRegionProps: {},
  canInspectDatabase: false,
};

export const PlatformCapabilitiesContext = createContext<PlatformCapabilities>(defaultCapabilities);

export const usePlatformCapabilities = (): PlatformCapabilities => useContext(PlatformCapabilitiesContext);

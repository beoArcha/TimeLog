import { createContext, useContext } from 'react';

export interface PlatformCapabilities {
  dragRegionProps: Record<string, unknown>;
}

const defaultCapabilities: PlatformCapabilities = {
  dragRegionProps: {},
};

export const PlatformCapabilitiesContext = createContext<PlatformCapabilities>(defaultCapabilities);

export const usePlatformCapabilities = () => useContext(PlatformCapabilitiesContext);

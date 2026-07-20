import React, { createContext, useContext } from 'react';

export interface PlatformCapabilities {
  dragRegionProps: Record<string, unknown>;
}

const defaultCapabilities: PlatformCapabilities = {
  dragRegionProps: {},
};

export const PlatformCapabilitiesContext = createContext<PlatformCapabilities>(defaultCapabilities);

export const usePlatformCapabilities = () => useContext(PlatformCapabilitiesContext);

export const PlatformCapabilitiesProvider: React.FC<{
  capabilities: PlatformCapabilities;
  children: React.ReactNode;
}> = ({ capabilities, children }) => {
  return (
    <PlatformCapabilitiesContext.Provider value={capabilities}>
      {children}
    </PlatformCapabilitiesContext.Provider>
  );
};

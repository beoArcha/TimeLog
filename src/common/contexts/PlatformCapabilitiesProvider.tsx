import React from 'react';
import { PlatformCapabilities, PlatformCapabilitiesContext } from './PlatformCapabilitiesContext';

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

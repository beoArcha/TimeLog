import React from 'react';
import { useOxyFlow } from '@common/hooks/OxyContext';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { AppLogo } from './header-parts/AppLogo';
import { LayoutSelector } from './header-parts/LayoutSelector';
import { TextScaleSelector } from './header-parts/TextScaleSelector';
import { ThemeSelector } from './header-parts/ThemeSelector';
import { LanguageSelector } from './header-parts/LanguageSelector';
import { StatusIndicator } from './header-parts/StatusIndicator';

export default function Header() {
  const { dragRegionProps } = usePlatformCapabilities();
  const { resolvedTheme } = useOxyFlow();

  return (
    <div
      {...dragRegionProps}
      className={`border-b transition-all duration-300 ${
        resolvedTheme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB]' : 'bg-slate-900/60 backdrop-blur-2xl border-white/5'
      } py-3.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-4`}
    >
      <AppLogo />

      <div className="flex flex-wrap items-center gap-3">
        <LayoutSelector />
        <TextScaleSelector />
        <ThemeSelector />
        <LanguageSelector />
      </div>

      <StatusIndicator />
    </div>
  );
}

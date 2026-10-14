import React from 'react';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { AppLogo } from './header-parts/AppLogo';
import { LayoutSelector } from './header-parts/LayoutSelector';
import { TextScaleSelector } from './header-parts/TextScaleSelector';
import { ThemeSelector } from './header-parts/ThemeSelector';
import { LanguageSelector } from './header-parts/LanguageSelector';
import { StatusIndicator } from './header-parts/StatusIndicator';
import { useSettings } from '@common/hooks/SettingsContext';

export default function Header() {
  const { dragRegionProps } = usePlatformCapabilities();
  const { resolvedTheme, layoutVariant } = useSettings();

  const isMediumMode = layoutVariant === 'medium';

  return (
    <header
      {...dragRegionProps}
      data-testid="layout-header"
      className={`shrink-0 sticky top-0 z-30 border-b transition-all duration-300 ${
        resolvedTheme === 'light' ? 'bg-[#FCFAF8] border-[#DFD7CB]' : 'bg-slate-900/60 backdrop-blur-2xl border-white/5'
      } py-2 px-3 sm:py-2.5 sm:px-4 flex ${
        isMediumMode ? 'flex-col gap-2' : 'flex-col md:flex-row md:items-center'
      } justify-between md:gap-3`}
    >
      <div className="flex items-center justify-between gap-2 w-full md:w-auto">
        <AppLogo />
        <div className={`flex ${isMediumMode ? '' : 'md:hidden'} items-center gap-1.5`}>
          <StatusIndicator />
          <LayoutSelector />
        </div>
      </div>

      <div className={`flex items-center justify-between ${isMediumMode ? '' : 'md:justify-end'} gap-1.5 sm:gap-2 w-full md:w-auto`}>
        {!isMediumMode && (
          <div className="hidden md:flex items-center">
            <LayoutSelector />
          </div>
        )}
        <ThemeSelector />
        <TextScaleSelector />
        <LanguageSelector />
        {!isMediumMode && (
          <div className="hidden md:flex items-center">
            <StatusIndicator />
          </div>
        )}
      </div>
    </header>
  );
}

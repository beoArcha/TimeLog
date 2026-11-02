import React from 'react';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { AppLogo } from './header-parts/AppLogo';
import { LayoutSelector } from './header-parts/LayoutSelector';
import { TextScaleSelector } from './header-parts/TextScaleSelector';
import { ThemeSelector } from './header-parts/ThemeSelector';
import { LanguageSelector } from './header-parts/LanguageSelector';
import { StatusIndicator } from './header-parts/StatusIndicator';
import { useSettings } from '@common/hooks/SettingsContext';
import { HStack } from '@components/ui/stack';
import { Area } from '@components/ui/area';

export default function Header() {
  const { dragRegionProps } = usePlatformCapabilities();
  const { layoutVariant } = useSettings();

  const isMediumMode = layoutVariant === 'medium';

  return (
    <Area
      as="header"
      {...dragRegionProps}
      data-testid="layout-header"
      className={`shrink-0 sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-2xl transition-all duration-300 py-2 px-3 sm:py-2.5 sm:px-4 flex ${
        isMediumMode ? 'flex-col gap-2' : 'flex-col md:flex-row md:items-center'
      } justify-between md:gap-3`}
    >
      <HStack justify="between" align="center" gap="sm" className="w-full md:w-auto">
        <AppLogo />
        <HStack align="center" gap="xs" className={isMediumMode ? '' : 'md:hidden'}>
          <StatusIndicator />
          <LayoutSelector />
        </HStack>
      </HStack>

      <HStack
        align="center"
        justify="between"
        wrap
        className={`gap-1.5 sm:gap-2 w-full md:w-auto ${isMediumMode ? '' : 'md:justify-end'}`}
      >
        {!isMediumMode && (
          <HStack align="center" className="hidden md:flex">
            <LayoutSelector />
          </HStack>
        )}
        <ThemeSelector />
        <TextScaleSelector />
        <LanguageSelector />
        {!isMediumMode && (
          <HStack align="center" className="hidden md:flex">
            <StatusIndicator />
          </HStack>
        )}
      </HStack>
    </Area>
  );
}

import React from 'react';
import { Shield } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import metadata from '@/metadata.json';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { Badge } from '@components/ui/badge';
import { Caption, Heading } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';

export const AppLogo: React.FC = () => {
  const { dragRegionProps } = usePlatformCapabilities();
  const { locale, customTranslations } = useLocale();
  const { layoutVariant } = useSettings();

  return (
    <HStack gap="sm" className="sm:gap-2.5 shrink-0" {...dragRegionProps}>
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-orange-400 to-rose-500 shadow-md flex items-center justify-center text-white shrink-0">
        <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      <div>
        <Heading
          level={1}
          data-testid="app-header-logo"
          className="font-sans font-bold text-sm sm:text-base tracking-tight leading-none flex items-center text-foreground"
        >
          <span>oXyFlow TimeLog</span>
          <Badge variant="orange" size="xs" as="span" className="ml-1.5 font-mono">
            v{metadata.versions.subversions.front}
          </Badge>
        </Heading>
        {layoutVariant === 'full' && (
          <Caption as="p" className="hidden sm:block mt-0.5 font-sans">
            {translate(locale, 'app', 'Subtitle', customTranslations)}
          </Caption>
        )}
      </div>
    </HStack>
  );
};

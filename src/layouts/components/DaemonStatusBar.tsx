import React from 'react';
import { AnimatedFade } from '@components/AnimatedFade';
import { RefreshCw } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { Caption, Text } from '@components/ui/typography';
import { VStack } from '@components/ui/stack';

export default function DaemonStatusBar() {
  const { locale, customTranslations } = useLocale();
  const { engineState } = useData();
  const { hasNativeDaemon } = usePlatformCapabilities();

  const isPwa = hasNativeDaemon === false;

  if (isPwa || engineState !== 'connecting') {
    return null;
  }

  return (
    <AnimatedFade
      id="engine-connecting-status-bar"
      className="shrink-0 mb-1 bg-card/60 backdrop-blur-md border border-border text-xs rounded-xl py-2 px-3 sm:py-2.5 sm:px-4 flex items-center gap-3 transition-all"
    >
      <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
      <VStack gap="2xs" className="flex-1 text-left">
        <Text as="strong" weight="bold" className="text-foreground">
          {translate(locale, 'engine', 'Searching', customTranslations)}
        </Text>
        <Caption className="mt-0.5">{translate(locale, 'engine', 'Connecting', customTranslations)}</Caption>
      </VStack>
    </AnimatedFade>
  );
}

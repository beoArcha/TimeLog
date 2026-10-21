import React from 'react';
import { Settings } from 'lucide-react';
import EngineConfig from './components/EngineConfig';
import AutomationSettings from './components/AutomationSettings';
import HolidaysLeavesCard from './components/HolidaysLeavesCard';
import DestructiveResetCard from './components/DestructiveResetCard';
import AppVersionsCard from './components/AppVersionsCard';
import { translate } from '@common/i18n/translator';
import { Heading, Caption } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';
import { useLocale } from '@common/hooks/LocaleProvider';

export default function SettingsTab() {
  const { customTranslations, locale } = useLocale();

  return (
    <div className="text-left flex flex-col gap-6 max-h-[85vh] overflow-y-auto pr-1">
      <div className="border-b border-border pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Heading level={2} className="text-lg font-bold text-foreground">
            <HStack gap="sm">
              <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
              <span>{translate(locale, 'settings', 'Title', customTranslations)}</span>
            </HStack>
          </Heading>
          <Caption variant="muted">{translate(locale, 'settings', 'Description', customTranslations)}</Caption>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <EngineConfig />
        <AutomationSettings />
        <HolidaysLeavesCard />
        <DestructiveResetCard />
        <AppVersionsCard />
      </div>
    </div>
  );
}

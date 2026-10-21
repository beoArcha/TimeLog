import React from 'react';
import { CalendarDays } from 'lucide-react';
import { Heading } from '@components/ui/typography';
import { HStack } from '@components/ui/stack';
import HolidaysLeavesView from '@features/holidays/HolidaysLeavesView';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';

export function HolidaysLeavesCard() {
  const { locale, customTranslations } = useLocale();

  return (
    <div className="mt-2">
      <Heading level={3} className="text-lg font-bold mb-4">
        <HStack gap="sm">
          <CalendarDays className="w-5 h-5 text-orange-400" />
          <span>{translate(locale, 'settings', 'HolidaysTitle', customTranslations)}</span>
        </HStack>
      </Heading>
      <HolidaysLeavesView />
    </div>
  );
}

export default HolidaysLeavesCard;

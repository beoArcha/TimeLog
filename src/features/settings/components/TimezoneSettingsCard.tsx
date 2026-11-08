import React, { useMemo } from 'react';
import { Globe, Clock } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { translate } from '@common/i18n/translator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Badge } from '@components/ui/badge';
import { HStack, VStack } from '@components/ui/stack';
import { Text, Caption } from '@components/ui/typography';
import { POPULAR_TIMEZONES, getSupportedTimezones, formatTime } from '@common/utils/timeFormat';

export function TimezoneSettingsCard() {
  const { locale, customTranslations } = useLocale();
  const { timezone, setTimezone, resolvedTimezone } = useSettings();
  const options = useMemo(() => Array.from(new Set(['System', 'UTC', ...POPULAR_TIMEZONES, ...getSupportedTimezones()])), []);
  const previewTime = formatTime(useMemo(() => new Date(), []), resolvedTimezone, locale);

  return (
    <CollapsibleCard
      title={translate(locale, 'settings', 'TimezoneTitle', customTranslations)}
      icon={Globe}
      iconColor="text-sky-500"
      defaultExpanded={true}
      headerTestId="timezone-settings-card-header"
    >
      <VStack gap="md">
        <Caption variant="muted">{translate(locale, 'settings', 'TimezoneDesc', customTranslations)}</Caption>
        <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <VStack gap="xs" className="min-w-0">
            <HStack align="center" gap="sm">
              <Clock className="w-4 h-4 text-sky-500 shrink-0" aria-hidden="true" />
              <Text size="base" weight="bold" className="text-foreground truncate">
                {timezone === 'System' ? translate(locale, 'settings', 'TimezoneSystem', customTranslations) : timezone}
              </Text>
              <Badge variant={timezone === 'System' ? 'outline' : 'default'} className="font-mono text-2xs">{resolvedTimezone}</Badge>
            </HStack>
            <Caption variant="muted" size="xs">
              {translate(locale, 'settings', 'TimezoneActive', customTranslations, { tz: resolvedTimezone })}
              {previewTime ? ` • ${previewTime}` : ''}
            </Caption>
          </VStack>
          <div className="w-full sm:w-64">
            <Select value={timezone} onValueChange={(val) => val && setTimezone(val)}>
              <SelectTrigger data-testid="timezone-select-trigger" aria-label={translate(locale, 'settings', 'TimezoneSelectAria', customTranslations)}>
                <SelectValue>{timezone}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto">
                {options.map((tz) => (
                  <SelectItem key={tz} value={tz} data-testid={`timezone-option-${tz}`}>
                    {tz === 'System' ? translate(locale, 'settings', 'TimezoneSystem', customTranslations) : tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </VStack>
    </CollapsibleCard>
  );
}

export default TimezoneSettingsCard;

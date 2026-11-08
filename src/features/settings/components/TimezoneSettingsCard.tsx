import React, { useState, useEffect, useMemo } from 'react';
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

/**
 * Presentation component allowing users to configure their display timezone preference.
 *
 * Provides a settings card for selecting between system-inferred timezone, UTC,
 * or regional IANA timezones. All underlying database and engine operations remain strictly
 * in UTC; this preference only governs date and time representation across views and reports.
 */
export function TimezoneSettingsCard() {
  const { locale, customTranslations } = useLocale();
  const { timezone, setTimezone, resolvedTimezone } = useSettings();

  const options = useMemo(() => {
    const rawTimezones = [...POPULAR_TIMEZONES, ...getSupportedTimezones()];
    const uniqueTimezones = Array.from(new Set(rawTimezones)).filter(
      (tz) => tz !== 'System' && tz !== 'UTC'
    );
    uniqueTimezones.sort((a, b) => a.localeCompare(b));
    return ['System', 'UTC', ...uniqueTimezones];
  }, []);

  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const previewTime = useMemo(
    () => formatTime(currentTime, resolvedTimezone, locale),
    [currentTime, resolvedTimezone, locale]
  );

  const selectedLabel = timezone === 'System'
    ? translate(locale, 'settings', 'TimezoneSystem', customTranslations)
    : timezone;

  return (
    <CollapsibleCard
      title={translate(locale, 'settings', 'TimezoneTitle', customTranslations)}
      icon={Globe}
      iconColor="text-info"
      titleColor="text-foreground"
      defaultExpanded={true}
      headerTestId="timezone-settings-card-header"
    >
      <VStack gap="md">
        <Caption variant="muted">{translate(locale, 'settings', 'TimezoneDesc', customTranslations)}</Caption>
        <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <VStack gap="xs" className="min-w-0">
            <HStack align="center" gap="sm">
              <Clock className="w-4 h-4 text-info shrink-0" aria-hidden="true" />
              <Text size="base" weight="bold" className="text-foreground truncate">
                {selectedLabel}
              </Text>
              <Badge variant={timezone === 'System' ? 'outline' : 'default'} className="font-mono text-2xs">
                {resolvedTimezone}
              </Badge>
            </HStack>
            <Caption variant="muted" size="xs">
              {translate(locale, 'settings', 'TimezoneActive', customTranslations, { tz: resolvedTimezone })}
              {previewTime ? ` · ${previewTime}` : ''}
            </Caption>
          </VStack>
          <div className="w-full sm:w-64">
            <Select value={timezone} onValueChange={(val) => val && setTimezone(val)}>
              <SelectTrigger
                data-testid="timezone-select-trigger"
                aria-label={translate(locale, 'settings', 'TimezoneSelectAria', customTranslations)}
              >
                <SelectValue>{selectedLabel}</SelectValue>
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

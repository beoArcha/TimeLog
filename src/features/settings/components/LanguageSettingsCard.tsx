import React, { useState } from 'react';
import { Languages, Globe, SlidersHorizontal } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { useLocale } from '@common/hooks/LocaleProvider';
import { STANDARD_LOCALES, LOCALE_METADATA } from '@common/i18n/locales';
import { translate } from '@common/i18n/translator';
import { LanguageSelectionModal } from './LanguageSelectionModal';
import { CustomTranslationsEditor } from './CustomTranslationsEditor';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { HStack, VStack } from '@components/ui/stack';
import { Grid } from '@components/ui/grid';
import { Text, Caption, MonoText, Overline } from '@components/ui/typography';

export function LanguageSettingsCard() {
  const {
    localePref,
    setLocalePref,
    locale,
    customTranslations,
  } = useLocale();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentMeta = LOCALE_METADATA[localePref] || {
    nativeName: localePref,
    englishName: localePref,
  };
  const resolvedMeta = LOCALE_METADATA[locale] || {
    nativeName: locale,
    englishName: locale,
  };

  return (
    <>
      <CollapsibleCard
        title={translate(locale, 'settings', 'Title', customTranslations)}
        icon={Languages}
        iconColor="text-indigo-500"
        titleColor="text-foreground"
        defaultExpanded={true}
        headerTestId="language-settings-card-header"
        wrapperClassName="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 text-card-foreground shadow-xs"
      >
        <VStack gap="lg" className="mt-2">
          {/* Active Status & Modal Launcher */}
          <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <VStack gap="xs" className="min-w-0">
              <HStack align="center" gap="sm">
                <Globe className="w-5 h-5 text-indigo-500 shrink-0" aria-hidden="true" />
                <Text size="base" weight="bold" className="text-foreground truncate">
                  {localePref === 'system'
                    ? 'System default'
                    : `${currentMeta.nativeName} (${currentMeta.englishName})`}
                </Text>
                <Badge variant={localePref === 'system' ? 'outline' : 'default'} className="font-mono text-2xs uppercase">
                  {localePref}
                </Badge>
              </HStack>

              {localePref === 'system' ? (
                <Caption variant="muted" size="xs">
                  Active system resolution:{' '}
                  <span className="font-semibold text-foreground">
                    {resolvedMeta.nativeName} ({locale})
                  </span>
                </Caption>
              ) : (
                <Caption variant="muted" size="xs">
                  Language explicitly locked to user preference.
                </Caption>
              )}
            </VStack>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              data-testid="open-language-modal-btn"
              icon={SlidersHorizontal}
              className="shrink-0 self-start sm:self-auto"
            >
              <span>{translate(locale, 'settings', 'AddLanguage', customTranslations)}</span>
            </Button>
          </div>

          {/* Quick Language Selector Grid */}
          <VStack gap="xs">
            <Overline className="font-bold tracking-wider">
              Quick Language Selection
            </Overline>
            <Grid cols={2} gap="sm" className="sm:grid-cols-4 md:grid-cols-6">
              {/* System button */}
              <Button
                type="button"
                variant={localePref === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLocalePref('system')}
                data-testid="quick-lang-system"
                className="justify-between px-3 h-9"
              >
                <span className="truncate">System</span>
                <MonoText size="2xs" variant="muted" className="ml-1 uppercase">
                  SYS
                </MonoText>
              </Button>

              {/* 10 Standard Locales */}
              {STANDARD_LOCALES.map((code) => {
                const isSelected = localePref === code;
                const meta = LOCALE_METADATA[code];
                return (
                  <Button
                    key={code}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLocalePref(code)}
                    data-testid={`quick-lang-${code}`}
                    title={`${meta.nativeName} (${meta.englishName})`}
                    className="justify-between px-3 h-9"
                  >
                    <span className="truncate">{meta.nativeName}</span>
                    <MonoText size="2xs" variant="muted" className="ml-1 uppercase">
                      {code}
                    </MonoText>
                  </Button>
                );
              })}
            </Grid>
          </VStack>

          {/* Custom Translation Overrides Section (SRP decoupled) */}
          <CustomTranslationsEditor />
        </VStack>
      </CollapsibleCard>

      <LanguageSelectionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

export default LanguageSettingsCard;

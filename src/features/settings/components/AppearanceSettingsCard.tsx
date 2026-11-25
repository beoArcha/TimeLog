import React, { useMemo } from 'react';
import { Palette, Moon, Sun, Eye, Laptop, Type, LucideIcon } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { translate } from '@common/i18n/translator';
import { ThemeRegistry } from '@/src/styles/themeRegistry';
import type { ThemePreference } from '@common/types/ThemeTypes';
import type { TextAndIconSize } from '@bindings/TextAndIconSize';
import type { AppKey } from '@common/i18n/keys';
import { Button } from '@components/ui/button';
import { Grid } from '@components/ui/grid';
import { HStack, VStack } from '@components/ui/stack';
import { Caption, Overline } from '@components/ui/typography';

interface ThemeChoice {
  id: ThemePreference;
  icon: LucideIcon;
  labelKey?: AppKey;
  label?: string;
}

const THEME_ICON_MAP: Record<string, LucideIcon> = {
  dark: Moon,
  light: Sun,
  'high-contrast': Eye,
  system: Laptop,
};

const TEXT_SCALE_OPTIONS: ReadonlyArray<{
  value: TextAndIconSize;
  labelKey: 'TextScaleSmall' | 'TextScaleMedium' | 'TextScaleLarge';
  previewClass: string;
}> = [
  { value: 'small', labelKey: 'TextScaleSmall', previewClass: 'text-xs' },
  { value: 'medium', labelKey: 'TextScaleMedium', previewClass: 'text-sm' },
  { value: 'large', labelKey: 'TextScaleLarge', previewClass: 'text-base' },
];

export function AppearanceSettingsCard() {
  const { locale, customTranslations } = useLocale();
  const { theme: selectedThemeId, setTheme, textAndIconSize, setTextAndIconSize } = useSettings();

  const themeChoices: ThemeChoice[] = useMemo(() => {
    const registryThemes = ThemeRegistry.getInstance().getAll();
    const list: ThemeChoice[] = registryThemes.map((th) => ({
      id: th.id as ThemePreference,
      icon: THEME_ICON_MAP[th.id] || Palette,
      labelKey: th.displayNameKey,
      label: th.displayName,
    }));

    list.push({
      id: 'system',
      icon: Laptop,
      labelKey: 'ThemeSystemLabel',
    });

    return list;
  }, []);

  return (
    <CollapsibleCard
      title={translate(locale, 'settings', 'AppearanceTitle', customTranslations)}
      icon={Palette}
      iconColor="text-primary"
      titleColor="text-foreground"
      defaultExpanded={true}
      headerTestId="appearance-settings-card-header"
      wrapperClassName="p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border bg-card flex flex-col gap-4 text-card-foreground shadow-xs"
    >
      <VStack gap="lg" className="mt-1">
        <Caption variant="muted" size="xs">
          {translate(locale, 'settings', 'AppearanceDesc', customTranslations)}
        </Caption>

        <VStack gap="xs">
          <Overline className="font-bold tracking-wider">
            {translate(locale, 'settings', 'Theme', customTranslations)}
          </Overline>
          <Grid cols={2} gap="sm" className="sm:grid-cols-4">
            {themeChoices.map((choice) => {
              const Icon = choice.icon;
              const isSelected = selectedThemeId === choice.id;
              const labelText = choice.labelKey
                ? translate(locale, 'app', choice.labelKey, customTranslations)
                : choice.label || String(choice.id);

              return (
                <Button
                  key={choice.id}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme(choice.id)}
                  data-testid={`settings-theme-${choice.id}`}
                  aria-pressed={isSelected}
                  className="justify-start gap-2 px-3 h-10"
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{labelText}</span>
                </Button>
              );
            })}
          </Grid>
        </VStack>

        <VStack gap="xs">
          <HStack align="center" gap="xs">
            <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
            <Overline className="font-bold tracking-wider">
              {translate(locale, 'settings', 'TextScaleLabel', customTranslations)}
            </Overline>
          </HStack>
          <Caption variant="muted" size="xs">
            {translate(locale, 'settings', 'TextScaleDesc', customTranslations)}
          </Caption>
          <Grid cols={3} gap="sm" className="mt-1">
            {TEXT_SCALE_OPTIONS.map((opt) => {
              const isSelected = textAndIconSize === opt.value;
              const labelText = translate(locale, 'settings', opt.labelKey, customTranslations);

              return (
                <Button
                  key={opt.value}
                  type="button"
                  variant={isSelected ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTextAndIconSize(opt.value)}
                  data-testid={`settings-text-scale-${opt.value}`}
                  aria-pressed={isSelected}
                  className="justify-center gap-2 px-3 h-10"
                >
                  <span className={`font-serif font-bold leading-none ${opt.previewClass}`} aria-hidden="true">
                    A
                  </span>
                  <span className="truncate">{labelText}</span>
                </Button>
              );
            })}
          </Grid>
        </VStack>
      </VStack>
    </CollapsibleCard>
  );
}

export default AppearanceSettingsCard;

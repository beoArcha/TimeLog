import React from 'react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { Button } from '@components/ui/button';

const LAYOUT_KEY_MAP = {
  compact: 'SizeSmall',
  medium: 'SizeMedium',
  full: 'SizeLarge',
} as const;

const LAYOUT_SHORT_LABEL_MAP = {
  compact: 'S',
  medium: 'M',
  full: 'L',
} as const;

export const LayoutSelector: React.FC = () => {
  const { locale, customTranslations } = useLocale();
  const { layoutVariant, setLayoutVariant } = useSettings();
  const { showToast } = useWindowShell();

  return (
    <div className="flex p-0.5 rounded-lg border border-border bg-muted/40 transition-all duration-300 text-xs font-sans">
      {(['compact', 'medium', 'full'] as const).map(sz => {
        const isActive = layoutVariant === sz;
        const fullLabel = translate(locale, 'app', LAYOUT_KEY_MAP[sz], customTranslations);
        return (
          <Button
            key={sz}
            variant="ghost"
            size="xs"
            data-testid={`layout-variant-${sz}`}
            onClick={() => {
              setLayoutVariant(sz);
              if (showToast) {
                showToast(`${translate(locale, 'app', 'SizeChanged', customTranslations)} ${fullLabel}`);
              }
            }}
            title={fullLabel}
            className={`px-1.5 sm:px-2.5 py-0.5 h-auto rounded-md font-bold uppercase transition-all cursor-pointer ${
              isActive
                ? 'bg-card text-foreground border border-border shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className={layoutVariant === 'full' ? 'hidden sm:inline' : 'hidden'}>{fullLabel}</span>
            <span className={layoutVariant === 'full' ? 'sm:hidden' : ''}>{LAYOUT_SHORT_LABEL_MAP[sz]}</span>
          </Button>
        );
      })}
    </div>
  );
};

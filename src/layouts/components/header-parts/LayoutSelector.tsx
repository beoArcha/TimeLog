import React from 'react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';
import { Button } from '@components/ui/button';

export const LayoutSelector: React.FC = () => {
  const { locale, customTranslations } = useLocale();
  const { layoutVariant, setLayoutVariant } = useSettings();
  const { showToast } = useWindowShell();

  return (
    <div className="flex p-0.5 rounded-lg border border-border bg-muted/40 transition-all duration-300 text-[10px] font-sans">
      {(['compact', 'medium', 'full'] as const).map(sz => {
        const isActive = layoutVariant === sz;
        const fullLabel = sz === 'compact'
          ? translate(locale, 'app', 'SizeSmall', customTranslations)
          : sz === 'medium'
            ? translate(locale, 'app', 'SizeMedium', customTranslations)
            : translate(locale, 'app', 'SizeLarge', customTranslations);
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
            className={`px-1.5 sm:px-2.5 py-0.5 h-auto rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${
              isActive
                ? 'bg-card text-foreground border border-border shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className={layoutVariant === 'full' ? 'hidden sm:inline' : 'hidden'}>{fullLabel}</span>
            <span className={layoutVariant === 'full' ? 'sm:hidden' : ''}>{sz === 'compact' ? 'S' : sz === 'medium' ? 'M' : 'L'}</span>
          </Button>
        );
      })}
    </div>
  );
};

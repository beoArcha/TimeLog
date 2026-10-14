import React from 'react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { useWindowShell } from '@common/contexts/WindowShellContext';

export const LayoutSelector: React.FC = () => {
  const { locale, customTranslations } = useLocale();
  const { layoutVariant, setLayoutVariant, resolvedTheme } = useSettings();
  const { showToast } = useWindowShell();

  return (
    <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
      resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
    }`}>
      {(['compact', 'medium', 'full'] as const).map(sz => {
        const isActive = layoutVariant === sz;
        const fullLabel = sz === 'compact'
          ? translate(locale, 'app', 'SizeSmall', customTranslations)
          : sz === 'medium'
            ? translate(locale, 'app', 'SizeMedium', customTranslations)
            : translate(locale, 'app', 'SizeLarge', customTranslations);
        return (
          <button
            key={sz}
            data-testid={`layout-variant-${sz}`}
            onClick={() => {
              setLayoutVariant(sz);
              if (showToast) {
                showToast(`${translate(locale, 'app', 'SizeChanged', customTranslations)} ${fullLabel}`);
              }
            }}
            title={fullLabel}
            className={`px-1.5 sm:px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${isActive
              ? resolvedTheme === 'light'
                ? 'bg-[#FCFAF8] text-[#2C2421] border border-[#DFD7CB] shadow-sm font-bold'
                : 'bg-[#FCFAF8]/10 text-white border border-white/10 font-bold'
              : resolvedTheme === 'light'
                ? 'text-[#8A7A71] hover:text-[#2C2421]'
                : 'text-[#9B8C83] hover:text-white'
              }`}
          >
            <span className={layoutVariant === 'full' ? 'hidden sm:inline' : 'hidden'}>{fullLabel}</span>
            <span className={layoutVariant === 'full' ? 'sm:hidden' : ''}>{sz === 'compact' ? 'S' : sz === 'medium' ? 'M' : 'L'}</span>
          </button>
        );
      })}
    </div>
  );
};

import React from 'react';
import { useOxyFlow } from '@common/hooks/OxyContext';
import { translate } from '@common/i18n/translator';

export const LayoutSelector: React.FC = () => {
  const { layoutVariant, setLayoutVariant, resolvedTheme, locale, customTranslations, showToast } = useOxyFlow();

  return (
    <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
      resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
    }`}>
      {(['compact', 'medium', 'full'] as const).map(sz => {
        const isActive = layoutVariant === sz;
        return (
          <button
            key={sz}
            data-testid={`layout-variant-${sz}`}
            onClick={() => {
              setLayoutVariant(sz);
              if (showToast) {
                const label = sz === 'compact' ? translate(locale, 'app', 'SizeSmall', customTranslations) : sz === 'medium' ? translate(locale, 'app', 'SizeMedium', customTranslations) : translate(locale, 'app', 'SizeLarge', customTranslations);
                showToast(`${translate(locale, 'app', 'SizeChanged', customTranslations)} ${label}`);
              }
            }}
            className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${isActive
              ? resolvedTheme === 'light'
                ? 'bg-[#FCFAF8] text-[#2C2421] border border-[#DFD7CB] shadow-sm font-bold'
                : 'bg-[#FCFAF8]/10 text-white border border-white/10 font-bold'
              : resolvedTheme === 'light'
                ? 'text-[#8A7A71] hover:text-[#2C2421]'
                : 'text-[#9B8C83] hover:text-white'
              }`}
          >
            {sz === 'compact' ? translate(locale, 'app', 'SizeSmall', customTranslations) : sz === 'medium' ? translate(locale, 'app', 'SizeMedium', customTranslations) : translate(locale, 'app', 'SizeLarge', customTranslations)}
          </button>
        );
      })}
    </div>
  );
};

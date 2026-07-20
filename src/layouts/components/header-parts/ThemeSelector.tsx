import React from 'react';
import { Moon, Sun, Eye, Laptop, LucideIcon } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { ThemePreference } from '@common/types/ThemeTypes';
import { AppKey } from '@common/i18n/keys';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';

interface ThemeOption {
  id: ThemePreference;
  icon: LucideIcon;
  labelKey: AppKey;
}

const THEME_OPTIONS: ThemeOption[] = [
  { id: 'dark', icon: Moon, labelKey: 'ThemeDarkLabel' },
  { id: 'light', icon: Sun, labelKey: 'ThemeLightLabel' },
  { id: 'high-contrast', icon: Eye, labelKey: 'ThemeHighContrastLabel' },
  { id: 'system', icon: Laptop, labelKey: 'ThemeSystemLabel' },
];

export const ThemeSelector: React.FC = () => {
  const { locale, customTranslations } = useLocale();
  const { theme, setTheme, resolvedTheme } = useSettings();;

  return (
    <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
      resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
    }`}>
      {THEME_OPTIONS.map(th => {
        const isActive = theme === th.id;
        const labelText = translate(locale, 'app', th.labelKey, customTranslations);
        return (
          <button
            key={th.id}
            onClick={() => setTheme(th.id)}
            className={`px-2.5 py-0.5 flex items-center gap-1.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${
              isActive
                ? resolvedTheme === 'light'
                  ? 'bg-[#FCFAF8] text-orange-600 border border-[#DFD7CB] shadow-sm font-bold'
                  : 'bg-[#FCFAF8]/10 text-white border border-white/10 font-bold'
                : resolvedTheme === 'light'
                  ? 'text-[#8A7A71] hover:text-[#2C2421]'
                  : 'text-[#9B8C83] hover:text-white'
            }`}
          >
            <th.icon className="w-3 h-3" />
            <span className="hidden xl:inline">{labelText}</span>
          </button>
        );
      })}
    </div>
  );
};

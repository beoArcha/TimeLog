import React from 'react';
import { Moon, Sun, Eye, Laptop, LucideIcon } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { ThemePreference } from '@common/types/ThemeTypes';
import { AppKey } from '@common/i18n/keys';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { Button } from '@components/ui/button';

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
  const { theme, setTheme, resolvedTheme, layoutVariant } = useSettings();

  return (
    <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
      resolvedTheme === 'light' ? 'bg-muted/40 border-border' : 'bg-slate-950/40 border-white/10'
    }`}>
      {THEME_OPTIONS.map(th => {
        const isActive = theme === th.id;
        const labelText = translate(locale, 'app', th.labelKey, customTranslations);
        return (
          <Button
            key={th.id}
            variant="ghost"
            size="xs"
            onClick={() => setTheme(th.id)}
            title={labelText}
            aria-label={labelText}
            className={`p-1 sm:px-2 sm:py-0.5 h-auto flex items-center gap-1.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${
              isActive
                ? resolvedTheme === 'light'
                  ? 'bg-card text-orange-600 border border-border shadow-xs font-bold'
                  : 'bg-card/10 text-white border border-white/10 font-bold'
                : resolvedTheme === 'light'
                  ? 'text-muted-foreground hover:text-foreground'
                  : 'text-muted-foreground hover:text-white'
            }`}
          >
            <th.icon className="w-3 h-3" />
            {layoutVariant === 'full' && <span className="hidden xl:inline">{labelText}</span>}
          </Button>
        );
      })}
    </div>
  );
};

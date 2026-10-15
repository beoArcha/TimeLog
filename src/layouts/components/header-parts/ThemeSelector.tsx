import React from 'react';
import { Moon, Sun, Eye, Laptop, Palette, LucideIcon } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { ThemePreference } from '@common/types/ThemeTypes';
import { AppKey } from '@common/i18n/keys';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';
import { ThemeRegistry } from '@/src/styles/themeRegistry';
import { Button } from '@components/ui/button';

interface ThemeOption {
  id: ThemePreference;
  icon: LucideIcon;
  labelKey?: AppKey;
  label?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  dark: Moon,
  light: Sun,
  'high-contrast': Eye,
  system: Laptop,
};

export const ThemeSelector: React.FC = () => {
  const { locale, customTranslations } = useLocale();
  const { theme: currentThemeId, setTheme, layoutVariant } = useSettings();

  const options: ThemeOption[] = React.useMemo(() => {
    const registryThemes = ThemeRegistry.getInstance().getAll();
    const list: ThemeOption[] = registryThemes.map(th => ({
      id: th.id as ThemePreference,
      icon: ICON_MAP[th.id] || Palette,
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
    <div className="flex p-0.5 rounded-lg border border-border bg-muted/40 transition-all duration-300 text-[10px] font-sans">
      {options.map(th => {
        const isActive = currentThemeId === th.id;
        const labelText = th.labelKey
          ? translate(locale, 'app', th.labelKey, customTranslations)
          : th.label || String(th.id);

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
                ? 'bg-card text-orange-500 border border-border shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
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

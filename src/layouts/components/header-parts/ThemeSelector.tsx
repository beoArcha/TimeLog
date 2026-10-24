import React from "react";
import { Moon, Sun, Eye, Laptop, Palette, LucideIcon } from "lucide-react";
import { translate } from "@common/i18n/translator";
import { ThemePreference } from "@common/types/ThemeTypes";
import { AppKey } from "@common/i18n/keys";
import { useLocale } from "@common/hooks/LocaleProvider";
import { useSettings } from "@common/hooks/SettingsContext";
import { ThemeRegistry } from "@/src/styles/themeRegistry";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "@components/SegmentedControl";

interface ThemeOption {
  id: ThemePreference;
  icon: LucideIcon;
  labelKey?: AppKey;
  label?: string;
}

const ICON_MAP: Record<string, LucideIcon> = {
  dark: Moon,
  light: Sun,
  "high-contrast": Eye,
  system: Laptop,
};

export const ThemeSelector: React.FC = () => {
  const { locale, customTranslations } = useLocale();
  const { theme: currentThemeId, setTheme } = useSettings();

  const themeOptions: ThemeOption[] = React.useMemo(() => {
    const registryThemes = ThemeRegistry.getInstance().getAll();
    const list: ThemeOption[] = registryThemes.map((th) => ({
      id: th.id as ThemePreference,
      icon: ICON_MAP[th.id] || Palette,
      labelKey: th.displayNameKey,
      label: th.displayName,
    }));

    list.push({
      id: "system",
      icon: Laptop,
      labelKey: "ThemeSystemLabel",
    });

    return list;
  }, []);

  const options: SegmentedControlOption<ThemePreference>[] = themeOptions.map(
    (th) => {
      const labelText = th.labelKey
        ? translate(locale, "app", th.labelKey, customTranslations)
        : th.label || String(th.id);

      return {
        value: th.id,
        icon: th.icon,
        title: labelText,
        ariaLabel: labelText,
        testId: `theme-btn-${th.id}`,
      };
    },
  );

  return (
    <SegmentedControl
      value={currentThemeId}
      onChange={setTheme}
      options={options}
      size="xs"
      className="bg-muted/40 font-sans"
    />
  );
};

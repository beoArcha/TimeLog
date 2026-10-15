import { useMemo } from 'react';
import { useSettings } from '@common/hooks/SettingsContext';
import { ThemeColorTokens } from './themeContract';
import { ThemeRegistry, DARK_THEME_TOKENS } from './themeRegistry';

/**
 * Access active theme tokens and dark mode status via Dependency Inversion.
 */
export function useThemeTokens(): {
  tokens: ThemeColorTokens;
  isDark: boolean;
  themeId: string;
} {
  const { resolvedTheme } = useSettings();
  const themeId = resolvedTheme || 'dark';

  return useMemo(() => {
    const themeDef = ThemeRegistry.getInstance().get(themeId);
    if (themeDef) {
      return {
        tokens: themeDef.tokens,
        isDark: themeDef.isDark,
        themeId,
      };
    }

    return {
      tokens: DARK_THEME_TOKENS,
      isDark: true,
      themeId,
    };
  }, [themeId]);
}

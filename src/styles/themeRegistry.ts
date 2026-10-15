import { ThemeColorTokens, ThemeDefinition } from './themeContract';

export const LIGHT_THEME_TOKENS: ThemeColorTokens = {
  background: '#F4EFEA',
  foreground: '#2C2421',
  card: '#FCFAF8',
  cardForeground: '#2C2421',
  muted: '#EAE4DB',
  mutedForeground: '#7A6A61',
  border: '#DFD7CB',
  input: '#DFD7CB',
  primary: '#2C2421',
  primaryForeground: '#F4EFEA',
  secondary: '#EAE4DB',
  secondaryForeground: '#2C2421',
  accent: '#EAE4DB',
  accentForeground: '#2C2421',
  destructive: '#E11D48',
  destructiveForeground: '#FFFFFF',
  ring: '#F97316',
};

export const DARK_THEME_TOKENS: ThemeColorTokens = {
  background: '#0b0f19',
  foreground: '#F8FAFC',
  card: '#0F172A',
  cardForeground: '#F8FAFC',
  muted: 'rgba(255, 255, 255, 0.06)',
  mutedForeground: '#94A3B8',
  border: 'rgba(255, 255, 255, 0.12)',
  input: 'rgba(255, 255, 255, 0.15)',
  primary: '#F8FAFC',
  primaryForeground: '#0b0f19',
  secondary: 'rgba(255, 255, 255, 0.08)',
  secondaryForeground: '#F8FAFC',
  accent: 'rgba(255, 255, 255, 0.08)',
  accentForeground: '#F8FAFC',
  destructive: '#F43F5E',
  destructiveForeground: '#FFFFFF',
  ring: '#FB923C',
};

export const HIGH_CONTRAST_THEME_TOKENS: ThemeColorTokens = {
  background: '#000000',
  foreground: '#FFFFFF',
  card: '#000000',
  cardForeground: '#FFFFFF',
  muted: '#18181B',
  mutedForeground: '#E4E4E7',
  border: '#FFFFFF',
  input: '#FFFFFF',
  primary: '#FFFFFF',
  primaryForeground: '#000000',
  secondary: '#1F2937',
  secondaryForeground: '#FFFFFF',
  accent: '#27272A',
  accentForeground: '#FFFFFF',
  destructive: '#FF0033',
  destructiveForeground: '#FFFFFF',
  ring: '#FACC15',
};

const BUILTIN_THEMES: ThemeDefinition[] = [
  {
    id: 'light',
    displayNameKey: 'ThemeLightLabel',
    iconName: 'Sun',
    isDark: false,
    tokens: LIGHT_THEME_TOKENS,
  },
  {
    id: 'dark',
    displayNameKey: 'ThemeDarkLabel',
    iconName: 'Moon',
    isDark: true,
    tokens: DARK_THEME_TOKENS,
  },
  {
    id: 'high-contrast',
    displayNameKey: 'ThemeHighContrastLabel',
    iconName: 'Eye',
    isDark: true,
    tokens: HIGH_CONTRAST_THEME_TOKENS,
  },
];

/**
 * Registry managing built-in and extensible application themes.
 */
export class ThemeRegistry {
  private static instance: ThemeRegistry | null = null;
  private themes = new Map<string, ThemeDefinition>();

  private constructor() {
    this.registerBuiltins();
  }

  public static getInstance(): ThemeRegistry {
    if (!ThemeRegistry.instance) {
      ThemeRegistry.instance = new ThemeRegistry();
    }
    return ThemeRegistry.instance;
  }

  private registerBuiltins(): void {
    for (const theme of BUILTIN_THEMES) {
      this.themes.set(theme.id, theme);
    }
  }

  public register(theme: ThemeDefinition): void {
    this.themes.set(theme.id, theme);
  }

  public get(id: string): ThemeDefinition | undefined {
    return this.themes.get(id);
  }

  public getAll(): ThemeDefinition[] {
    return Array.from(this.themes.values());
  }

  public applyTheme(themeId: string): void {
    if (typeof document === 'undefined') return;

    const theme = this.get(themeId) || this.get('dark');
    const isDark = theme ? theme.isDark : themeId === 'dark';

    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.classList.toggle('dark', isDark);

    if (theme?.cssVariables && Object.keys(theme.cssVariables).length > 0) {
      let customStyleEl = document.getElementById('oxyflow-custom-theme-style') as HTMLStyleElement | null;
      if (!customStyleEl) {
        customStyleEl = document.createElement('style');
        customStyleEl.id = 'oxyflow-custom-theme-style';
        document.head.appendChild(customStyleEl);
      }
      const cssRules = Object.entries(theme.cssVariables)
        .map(([k, v]) => `  ${k}: ${v};`)
        .join('\n');
      customStyleEl.textContent = `[data-theme="${themeId}"] {\n${cssRules}\n}`;
    }
  }

  public reset(): void {
    this.themes.clear();
    this.registerBuiltins();
  }
}

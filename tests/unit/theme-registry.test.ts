// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeRegistry } from '@styles/themeRegistry';
import { ThemeDefinition, ThemeColorTokens } from '@styles/themeContract';

const createTestThemeTokens = (overrides?: Partial<ThemeColorTokens>): ThemeColorTokens => ({
  background: '#704214',
  foreground: '#fbf0d9',
  card: '#5c3317',
  cardForeground: '#fbf0d9',
  muted: '#8b5a2b',
  mutedForeground: '#d2b48c',
  border: '#a0522d',
  input: '#a0522d',
  primary: '#fbf0d9',
  primaryForeground: '#704214',
  secondary: '#8b5a2b',
  secondaryForeground: '#fbf0d9',
  accent: '#8b5a2b',
  accentForeground: '#fbf0d9',
  destructive: '#ff4500',
  destructiveForeground: '#ffffff',
  ring: '#cd853f',
  ...overrides,
});

describe('Unit Tests: ThemeRegistry and DIP Extensibility', () => {
  let registry: ThemeRegistry;

  beforeEach(() => {
    registry = ThemeRegistry.getInstance();
    registry.reset();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
    const styleEl = document.getElementById('oxyflow-custom-theme-style');
    if (styleEl) styleEl.remove();
  });

  it('Given ThemeRegistry initialized, Then it should have built-in themes (light, dark, high-contrast)', () => {
    const themes = registry.getAll();
    const ids = themes.map(t => t.id);

    expect(ids).toContain('light');
    expect(ids).toContain('dark');
    expect(ids).toContain('high-contrast');
    expect(registry.get('light')).toBeDefined();
    expect(registry.get('dark')).toBeDefined();
    expect(registry.get('high-contrast')).toBeDefined();
  });

  it('Given custom theme definition, When registered via DIP ThemeRegistry, Then it should be retrievable and listed in getAll', () => {
    const customSepiaTheme: ThemeDefinition = {
      id: 'sepia',
      displayName: 'Sepia Warm',
      iconName: 'Sun',
      isDark: true,
      tokens: createTestThemeTokens(),
      cssVariables: {
        '--color-background': '#704214',
        '--color-foreground': '#fbf0d9',
        '--color-card': '#5c3317',
        '--color-card-foreground': '#fbf0d9',
        '--color-border': '#a0522d',
      },
    };

    registry.register(customSepiaTheme);

    const retrieved = registry.get('sepia');
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('sepia');
    expect(retrieved?.displayName).toBe('Sepia Warm');
    expect(registry.getAll().some(t => t.id === 'sepia')).toBe(true);
  });

  it('Given custom theme registered, When applyTheme is called, Then it sets data-theme attribute and injects CSS variables without modifying any UI component code', () => {
    const customSepiaTheme: ThemeDefinition = {
      id: 'sepia',
      displayName: 'Sepia Warm',
      isDark: true,
      tokens: createTestThemeTokens(),
      cssVariables: {
        '--color-background': '#704214',
        '--color-foreground': '#fbf0d9',
        '--color-card': '#5c3317',
      },
    };

    registry.register(customSepiaTheme);
    registry.applyTheme('sepia');

    expect(document.documentElement.getAttribute('data-theme')).toBe('sepia');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const injectedStyle = document.getElementById('oxyflow-custom-theme-style');
    expect(injectedStyle).not.toBeNull();
    expect(injectedStyle?.textContent).toContain('[data-theme="sepia"]');
    expect(injectedStyle?.textContent).toContain('--color-background: #704214');
  });

  it('Given built-in theme applied, When applyTheme is called, Then it toggles dark class correctly', () => {
    registry.applyTheme('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    registry.applyTheme('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});

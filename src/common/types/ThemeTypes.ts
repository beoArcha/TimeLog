export type BuiltinTheme =
  | 'light'
  | 'dark'
  | 'high-contrast';

export type Theme =
  | BuiltinTheme
  | (string & {});

export type ThemePreference =
  | Theme
  | 'system';

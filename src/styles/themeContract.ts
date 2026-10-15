import { AppKey } from '@common/i18n/keys';

/**
 * Resolved semantic color tokens for direct JavaScript consumption.
 */
export interface ThemeColorTokens {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  ring: string;
}

/**
 * Metadata and style definitions for a theme.
 */
export interface ThemeDefinition {
  id: string;
  displayNameKey?: AppKey;
  displayName?: string;
  iconName?: string;
  isDark: boolean;
  tokens: ThemeColorTokens;
  cssVariables?: Record<string, string>;
}

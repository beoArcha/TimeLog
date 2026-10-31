export interface ProjectColorDefinition {
  name: string;
  bg: string;
  hex: string;
  text: string;
}

export const PROJECT_COLORS: readonly ProjectColorDefinition[] = [
  { name: 'rose', bg: 'bg-rose-500', hex: '#f43f5e', text: 'text-rose-500' },
  { name: 'teal', bg: 'bg-teal-500', hex: '#14b8a6', text: 'text-teal-500' },
  { name: 'amber', bg: 'bg-amber-500', hex: '#f59e0b', text: 'text-amber-500' },
  { name: 'violet', bg: 'bg-violet-500', hex: '#8b5cf6', text: 'text-violet-500' },
  { name: 'indigo', bg: 'bg-indigo-500', hex: '#6366f1', text: 'text-indigo-500' },
  { name: 'emerald', bg: 'bg-emerald-500', hex: '#10b981', text: 'text-emerald-500' },
] as const;

export const DEFAULT_PROJECT_COLOR = 'rose' as const;
export const DEFAULT_PROJECT_COLOR_HEX = '#f43f5e' as const;
export const HEX_COLOR_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Layout theme styles adapter mapping to semantic design tokens.
 *
 * @param _theme Active theme name.
 * @returns Object with semantic utility classes.
 */
export const getThemeStyles = (_theme?: string) => ({
  bgMuted: 'bg-muted',
  bgCard: 'bg-card',
  textMain: 'text-foreground',
  textMuted: 'text-muted-foreground',
  border: 'border-border',
  borderHl: 'border-ring/30',
  shadow: 'shadow-md',
  bgBadge: 'bg-muted'
});


export const PROJECT_COLORS = [
  { name: 'rose', bg: 'bg-rose-500', hex: '#f43f5e', text: 'text-rose-500' },
  { name: 'teal', bg: 'bg-teal-500', hex: '#14b8a6', text: 'text-teal-500' },
  { name: 'amber', bg: 'bg-amber-500', hex: '#f59e0b', text: 'text-amber-500' },
  { name: 'violet', bg: 'bg-violet-500', hex: '#8b5cf6', text: 'text-violet-500' },
  { name: 'indigo', bg: 'bg-indigo-500', hex: '#6366f1', text: 'text-indigo-500' },
  { name: 'emerald', bg: 'bg-emerald-500', hex: '#10b981', text: 'text-emerald-500' },
];


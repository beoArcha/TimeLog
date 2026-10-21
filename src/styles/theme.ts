
/**
 * Semantic class mapping adapter for legacy components transitioning to CSS variables.
 * Maps high-level token semantics to Tailwind v4 theme utility classes.
 */
export const THEME_SEMANTIC_CLASSES = {
  bg: "bg-background",
  text: "text-foreground",
  textMuted: "text-muted-foreground",
  border: "border-border",
  cardBg: "bg-card text-card-foreground",
  headerBg: "bg-muted",
  selectionBg: "selection:bg-ring/30",
  selectionText: "selection:text-foreground",
  primaryBlock: "bg-primary text-primary-foreground",
} as const;

/**
 * Backward-compatible THEME_COLORS map directing callers to semantic design tokens.
 */
export const THEME_COLORS = {
  light: THEME_SEMANTIC_CLASSES,
  dark: THEME_SEMANTIC_CLASSES,
  highContrast: THEME_SEMANTIC_CLASSES,
};

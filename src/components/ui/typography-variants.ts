import { cva } from "class-variance-authority";

export const headingVariants = cva("font-sans font-bold tracking-tight text-foreground", {
  variants: {
    level: {
      1: "text-2xl sm:text-3xl font-extrabold",
      2: "text-xl sm:text-2xl font-bold",
      3: "text-lg sm:text-xl font-bold",
      4: "text-base sm:text-lg font-semibold",
      5: "text-sm sm:text-base font-semibold",
      6: "text-xs sm:text-sm font-semibold",
    },
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      accent: "text-ring",
    },
  },
  defaultVariants: {
    level: 2,
    variant: "default",
  },
});

export const textVariants = cva("font-sans leading-relaxed", {
  variants: {
    variant: {
      body: "text-sm text-foreground",
      muted: "text-xs text-muted-foreground",
      caption: "text-[11px] text-muted-foreground tracking-wide",
      mono: "font-mono text-xs",
      metric: "font-mono font-bold tracking-tight text-foreground",
      label: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
      error: "text-xs text-destructive font-medium",
      success: "text-xs text-emerald-600 dark:text-emerald-400 font-medium",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl font-bold",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

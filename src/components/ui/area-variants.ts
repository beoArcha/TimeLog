import { cva, type VariantProps } from 'class-variance-authority';

export const areaVariants = cva('box-border transition-colors', {
  variants: {
    variant: {
      default: '',
      card: 'bg-card text-card-foreground border border-border',
      glass: 'bg-card/75 backdrop-blur-xl border border-border/80 text-card-foreground',
      muted: 'bg-muted/40 border border-border/60 text-foreground',
      well: 'bg-muted/70 border border-border/40 text-foreground shadow-inner',
      surface: 'bg-background border border-border/50 text-foreground',
      ghost: 'bg-transparent text-foreground',
    },
    padding: {
      none: 'p-0',
      xs: 'p-1.5',
      sm: 'p-2.5',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
      main: 'p-6',
      section: 'p-8',
    },
    radius: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      '3xl': 'rounded-3xl',
      main: 'rounded-main',
      section: 'rounded-section',
      full: 'rounded-full',
    },
    elevation: {
      none: 'shadow-none',
      xs: 'shadow-xs',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      '2xl': 'shadow-2xl',
      glass: 'shadow-2xl backdrop-blur-md',
    },
  },
  defaultVariants: {
    variant: 'default',
    padding: 'none',
    radius: 'none',
    elevation: 'none',
  },
});

export type AreaVariantProps = VariantProps<typeof areaVariants>;

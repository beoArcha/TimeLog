import { cva } from 'class-variance-authority';

export type ProgressVariant = 'primary' | 'accent' | 'orange' | 'success' | 'destructive';

export const progressVariants = cva(
  'relative w-full overflow-hidden rounded-full bg-muted',
  {
    variants: {
      size: {
        xs: 'h-1.5',
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export const progressIndicatorVariants = cva(
  'h-full w-full flex-1 transition-all duration-300 ease-out',
  {
    variants: {
      variant: {
        primary: 'bg-primary',
        accent: 'bg-accent text-accent-foreground',
        orange: 'bg-gradient-to-r from-orange-400 to-rose-500',
        success: 'bg-emerald-500',
        destructive: 'bg-destructive',
      },
    },
    defaultVariants: {
      variant: 'primary',
    },
  }
);

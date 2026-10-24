import { cva } from 'class-variance-authority';

export const iconBoxVariants = cva(
  'flex items-center justify-center shrink-0 transition-colors',
  {
    variants: {
      variant: {
        muted: 'bg-muted/40 text-foreground border border-border',
        outline: 'border border-border bg-transparent text-foreground',
        card: 'bg-card text-card-foreground border border-border shadow-xs',
        ghost: 'bg-transparent text-foreground',
        default: 'bg-muted/40 text-foreground border border-border',
      },
      size: {
        xs: 'w-6 h-6 text-xs',
        sm: 'w-8 h-8 text-sm',
        md: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        full: 'rounded-full',
        section: 'rounded-section',
      },
    },
    defaultVariants: {
      variant: 'muted',
      size: 'md',
      rounded: 'section',
    },
  }
);

import { cva } from 'class-variance-authority';

export const statusDotVariants = cva(
  'inline-block rounded-full shrink-0',
  {
    variants: {
      variant: {
        emerald: 'bg-emerald-500',
        amber: 'bg-amber-500',
        rose: 'bg-rose-500',
        orange: 'bg-orange-500',
        blue: 'bg-blue-500',
        muted: 'bg-muted-foreground',
        success: 'bg-success',
        destructive: 'bg-destructive',
        warning: 'bg-warning',
        info: 'bg-info',
        primary: 'bg-primary',
      },
      size: {
        '2xs': 'w-1.5 h-1.5',
        xs: 'w-2 h-2',
        sm: 'w-2.5 h-2.5',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
        xl: 'w-5 h-5',
      },
    },
    defaultVariants: {
      variant: 'emerald',
      size: 'xs',
    },
  }
);

export const statusDotPingVariants = cva(
  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
  {
    variants: {
      variant: {
        emerald: 'bg-emerald-400',
        amber: 'bg-amber-400',
        rose: 'bg-rose-400',
        orange: 'bg-orange-400',
        blue: 'bg-blue-400',
        muted: 'bg-muted-foreground/75',
        success: 'bg-success opacity-75',
        destructive: 'bg-destructive opacity-75',
        warning: 'bg-warning opacity-75',
        info: 'bg-info opacity-75',
        primary: 'bg-primary opacity-75',
      },
    },
    defaultVariants: {
      variant: 'emerald',
    },
  }
);

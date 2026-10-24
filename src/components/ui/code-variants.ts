import { cva } from 'class-variance-authority';

export const codeVariants = cva(
  'font-mono transition-colors select-all',
  {
    variants: {
      variant: {
        muted: 'bg-muted/50 border border-border/50 text-foreground',
        outline: 'border border-border bg-transparent text-foreground',
        card: 'bg-card border border-border text-card-foreground',
        code: 'bg-code-bg border border-code-border text-code-foreground',
        ghost: 'bg-transparent text-foreground',
      },
      size: {
        xs: 'text-2xs px-1 py-0.5 rounded-sm',
        sm: 'text-xs px-1.5 py-0.5 rounded',
        md: 'text-sm px-2 py-1 rounded-md',
      },
      block: {
        true: 'block w-full overflow-x-auto p-3 rounded-xl leading-relaxed',
        false: 'inline-block',
      },
    },
    defaultVariants: {
      variant: 'code',
      size: 'sm',
      block: false,
    },
  }
);

import { cva, type VariantProps } from 'class-variance-authority';
import type { UiSize } from '@common/types/designSystem';

export type InputSize = Extract<UiSize, 'sm' | 'md' | 'lg'>;

export const inputVariants = cva(
  'w-full min-w-0 rounded-lg border border-input bg-transparent transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted/30 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
  {
    variants: {
      size: {
        sm: 'h-7 px-2.5 py-0.5 text-xs',
        md: 'h-8 px-3 py-1 text-sm',
        lg: 'h-9 px-3.5 py-1.5 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export const textareaVariants = cva(
  'flex w-full rounded-lg border border-input bg-transparent shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/20',
  {
    variants: {
      size: {
        sm: 'min-h-[60px] px-2.5 py-1.5 text-xs',
        md: 'min-h-[80px] px-3 py-2 text-sm',
        lg: 'min-h-[100px] px-3.5 py-2.5 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export const selectTriggerVariants = cva(
  'flex w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent shadow-xs transition-all outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[placeholder]:text-muted-foreground',
  {
    variants: {
      size: {
        sm: 'h-7 px-2.5 py-0.5 text-xs',
        md: 'h-8 px-3 py-1 text-sm',
        lg: 'h-9 px-3.5 py-1.5 text-base',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export type InputVariantsProps = VariantProps<typeof inputVariants>;
export type TextareaVariantsProps = VariantProps<typeof textareaVariants>;
export type SelectTriggerVariantsProps = VariantProps<typeof selectTriggerVariants>;

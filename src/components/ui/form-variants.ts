import { cva, type VariantProps } from 'class-variance-authority';

export const formVariants = cva('w-full', {
  variants: {
    layout: {
      vertical: 'flex flex-col',
      horizontal: 'flex flex-row items-center',
      none: '',
    },
    gap: {
      none: 'gap-0',
      '3xs': 'gap-0.5',
      '2xs': 'gap-1',
      xs: 'gap-1.5',
      sm: 'gap-2',
      md: 'gap-3',
      lg: 'gap-4',
      xl: 'gap-6',
      '2xl': 'gap-8',
      main: 'gap-6',
      section: 'gap-10',
    },
  },
  defaultVariants: {
    layout: 'vertical',
    gap: 'md',
  },
});

export type FormLayout = 'vertical' | 'horizontal' | 'none';

export type FormGap =
  | 'none'
  | '3xs'
  | '2xs'
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | 'main'
  | 'section';

export type FormVariantProps = VariantProps<typeof formVariants>;

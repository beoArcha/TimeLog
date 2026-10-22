import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { iconBoxVariants } from './icon-box-variants';
import type { AsDivOrSpan } from '../types';

export type IconBoxProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof iconBoxVariants> & {
    as?: AsDivOrSpan;
  };

export const IconBox = React.forwardRef<HTMLElement, IconBoxProps>(
  (
    {
      className,
      variant,
      size,
      rounded,
      as: Component = 'div',
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref as never}
        data-slot="icon-box"
        className={cn(iconBoxVariants({ variant, size, rounded }), className)}
        {...props}
      />
    );
  }
);

IconBox.displayName = 'IconBox';

export default IconBox;

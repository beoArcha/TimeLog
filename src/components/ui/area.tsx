import * as React from 'react';
import { cn } from '@/lib/utils';
import { areaVariants, type AreaVariantProps } from './area-variants';

export type AreaTag =
  | 'aside'
  | 'section'
  | 'article'
  | 'nav'
  | 'header'
  | 'footer'
  | 'main'
  | 'div';

export type AreaProps = React.HTMLAttributes<HTMLElement> &
  AreaVariantProps & {
    as?: AreaTag;
  };

/**
 * Polymorphic layout and surface container primitive providing consistent background, border, padding, and elevation tokens.
 */
export const Area = React.forwardRef<HTMLElement, AreaProps>(
  (
    {
      as: Component = 'div',
      className,
      variant,
      padding,
      radius,
      elevation,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <Component
        ref={ref as React.Ref<never>}
        data-slot="area"
        className={cn(areaVariants({ variant, padding, radius, elevation }), className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Area.displayName = 'Area';

export default Area;

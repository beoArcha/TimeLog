import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { statusDotVariants, statusDotPingVariants } from './status-dot-variants';

export type StatusDotProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof statusDotVariants> & {
    ping?: boolean;
  };

const sizeClassesMap: Record<string, string> = {
  '2xs': 'w-1.5 h-1.5',
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
};

export function StatusDot({
  variant,
  size,
  ping = false,
  className,
  ...props
}: StatusDotProps) {
  if (ping) {
    const sizeClass = size ? sizeClassesMap[size] : sizeClassesMap.xs;
    return (
      <span
        data-slot="status-dot"
        className={cn('relative inline-flex shrink-0', sizeClass, className)}
        {...props}
      >
        <span className={cn(statusDotPingVariants({ variant }))} />
        <span
          className={cn(
            'relative inline-flex rounded-full h-full w-full',
            statusDotVariants({ variant })
          )}
        />
      </span>
    );
  }

  return (
    <span
      data-slot="status-dot"
      className={cn(statusDotVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export default StatusDot;

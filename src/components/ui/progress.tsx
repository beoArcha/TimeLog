import * as React from 'react';
import { Progress as ProgressPrimitive } from '@base-ui/react/progress';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { progressVariants, progressIndicatorVariants, type ProgressVariant } from './progress-variants';

const ProgressRoot = ProgressPrimitive.Root;
const ProgressTrack = ProgressPrimitive.Track;
const ProgressIndicator = ProgressPrimitive.Indicator;

export interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  indicatorVariant?: ProgressVariant;
  indicatorClassName?: string;
}

/**
 * Semantic and accessible progress bar primitive with size and color variants.
 */
export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      size,
      indicatorVariant = 'primary',
      indicatorClassName,
      ...props
    },
    ref
  ) => {
    return (
      <ProgressRoot
        ref={ref}
        value={value}
        data-slot="progress"
        className={cn(progressVariants({ size }), className)}
        {...props}
      >
        <ProgressTrack className="h-full w-full">
          <ProgressIndicator
            className={cn(
              progressIndicatorVariants({ variant: indicatorVariant as ProgressVariant }),
              indicatorClassName
            )}
            style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
          />
        </ProgressTrack>
      </ProgressRoot>
    );
  }
);

Progress.displayName = 'Progress';

export type ProgressBarProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof progressVariants> & {
    value: number;
    max?: number;
    min?: number;
    variant?: ProgressVariant;
    indicatorClassName?: string;
    'aria-label'?: string;
  };

/**
 * Convenient standalone progress bar with percentage clamping and semantic accessibility.
 */
export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      min = 0,
      size,
      variant = 'primary',
      indicatorClassName,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const clampedPercentage = Math.min(
      100,
      Math.max(0, ((value - min) / (max - min)) * 100)
    );

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(clampedPercentage)}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-label={ariaLabel}
        data-slot="progress-bar"
        className={cn(progressVariants({ size }), className)}
        {...props}
      >
        <div
          data-slot="progress-bar-indicator"
          className={cn(
            progressIndicatorVariants({ variant: variant as ProgressVariant }),
            indicatorClassName
          )}
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export { ProgressRoot, ProgressTrack, ProgressIndicator };
export default Progress;

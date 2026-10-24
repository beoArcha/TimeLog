import React from 'react';
import { ProgressBar, type ProgressBarProps } from '@components/ui/progress';

export type AnimatedProgressBarProps = ProgressBarProps & {
  duration?: number;
};

/**
 * Accessible animated progress bar delegating to the ProgressBar UI primitive.
 */
export function AnimatedProgressBar({
  variant = 'orange',
  ...props
}: AnimatedProgressBarProps) {
  return <ProgressBar variant={variant} {...props} />;
}

export default AnimatedProgressBar;


import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AnimatedProgressBarProps {
  value: number;
  duration?: number;
  className?: string;
  indicatorClassName?: string;
  'aria-label'?: string;
  id?: string;
}

/**
 * Accessible animated progress bar with smooth width interpolation.
 */
export function AnimatedProgressBar({
  value,
  duration = 0.5,
  className,
  indicatorClassName,
  'aria-label': ariaLabel,
  id,
}: AnimatedProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div
      id={id}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      className={cn('w-full h-3 rounded-full overflow-hidden relative bg-muted', className)}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${clampedValue}%` }}
        transition={{ duration, ease: 'easeOut' }}
        className={cn(
          'h-full bg-gradient-to-r from-orange-400 to-rose-500 rounded-full',
          indicatorClassName
        )}
      />
    </div>
  );
}

export default AnimatedProgressBar;

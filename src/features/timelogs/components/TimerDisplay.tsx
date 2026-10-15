import React from 'react';
import { cn } from '@/lib/utils';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';

export interface TimerDisplayProps {
  /** Time value as seconds (number) or pre-formatted time string (e.g. "00:00:00") */
  value: string | number;
  isRunning?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'plain' | 'pill' | 'highlight';
  theme?: string;
  id?: string;
  className?: string;
}

/**
 * Monospace timer display with design tokens and active state indicator.
 */
export function TimerDisplay({
  value,
  isRunning = false,
  size = 'md',
  variant = 'plain',
  theme,
  id,
  className,
}: TimerDisplayProps) {
  const displayString = typeof value === 'number' ? formatSeconds(value) : value;

  const sizeClasses = {
    xs: 'text-[10px] tracking-tight',
    sm: 'text-xs tracking-tight',
    md: 'text-sm font-semibold tracking-tight',
    lg: 'text-base font-bold tracking-tight',
    xl: 'text-xl font-extrabold tracking-tight',
  }[size];

  const variantClasses = {
    plain: cn(
      theme === 'light' ? 'text-foreground' : 'text-foreground',
      isRunning && 'text-orange-500 dark:text-orange-400'
    ),
    pill: cn(
      'px-2 py-0.5 rounded-md border transition-all inline-flex items-center justify-center',
      isRunning
        ? 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-300 font-bold'
        : theme === 'light'
          ? 'bg-[#EAE4DB] border-[#DFD7CB] text-[#7A6A61]'
          : 'bg-muted border-border border-white/10 text-muted-foreground'
    ),
    highlight: cn(
      'px-2.5 py-1 rounded-full border transition-all inline-flex items-center justify-center font-bold',
      theme === 'high-contrast'
        ? 'bg-black border-white text-white'
        : 'bg-card border-border text-foreground'
    ),
  }[variant];

  return (
    <span
      id={id}
      className={cn(
        'font-mono tabular-nums select-none inline-flex items-center',
        sizeClasses,
        variantClasses,
        className
      )}
    >
      {displayString}
    </span>
  );
}

export default TimerDisplay;

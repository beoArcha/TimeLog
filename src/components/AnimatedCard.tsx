import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  delay?: number;
  hoverable?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Encapsulated design system animated container using motion.
 * Provides accessible, smooth entry animations with design system border and card styling.
 */
export function AnimatedCard({
  delay = 0,
  hoverable = true,
  className,
  children,
  initial = { opacity: 0, y: 10 },
  animate = { opacity: 1, y: 0 },
  transition,
  ...rest
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      transition={transition ?? { duration: 0.25, delay }}
      className={cn(
        'p-5 rounded-3xl border border-border bg-card shadow-xs transition-all duration-300 flex flex-col h-full',
        hoverable && 'hover:border-primary/30 hover:shadow-md',
        className
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedCard;

import React from 'react';
import { motion, useReducedMotion, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  delay?: number;
  hoverable?: boolean;
  className?: string;
  children?: React.ReactNode;
  reducedMotion?: boolean;
}

/**
 * Animated container card with entrance transition.
 */
export function AnimatedCard({
  delay = 0,
  hoverable = true,
  className,
  children,
  initial = { opacity: 0, y: 10 },
  animate = { opacity: 1, y: 0 },
  transition,
  reducedMotion,
  ...rest
}: AnimatedCardProps) {
  const systemReducedMotion = useReducedMotion();
  const shouldReduceMotion = reducedMotion ?? systemReducedMotion;

  const resolvedInitial = shouldReduceMotion ? false : initial;
  const resolvedTransition = shouldReduceMotion
    ? { duration: 0 }
    : (transition ?? { duration: 0.25, delay });


  return (
    <motion.div
      initial={resolvedInitial}
      animate={animate}
      transition={resolvedTransition}
      className={cn(
        'p-5 rounded-3xl border border-border bg-card shadow-xs transition-[border-color,box-shadow] duration-300 motion-reduce:transition-none flex flex-col h-full',
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


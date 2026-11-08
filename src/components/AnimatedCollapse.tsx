import React from 'react';
import { motion, AnimatePresence, type HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AnimatedCollapseProps extends HTMLMotionProps<'div'> {
  isOpen?: boolean;
  duration?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Collapsible container with height and opacity transitions.
 */
export function AnimatedCollapse({
  isOpen = true,
  duration = 0.25,
  className,
  children,
  ...rest
}: AnimatedCollapseProps) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration, ease: 'easeInOut' }}
          className={cn('overflow-hidden', className)}
          {...rest}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AnimatedCollapse;

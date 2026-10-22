import React from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

export interface AnimatedFadeProps extends HTMLMotionProps<'div'> {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Reusable animated fade and scale transition wrapper.
 * Provides accessible, smooth opacity and scale transitions for tab content, viewports, and status indicators.
 */
export function AnimatedFade({
  className,
  children,
  initial = { opacity: 0 },
  animate = { opacity: 1 },
  exit = { opacity: 0 },
  transition = { duration: 0.2 },
  ...rest
}: AnimatedFadeProps) {
  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={exit}
      transition={transition}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export default AnimatedFade;

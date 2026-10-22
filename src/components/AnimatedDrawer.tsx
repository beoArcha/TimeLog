import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/lib/utils';

export interface AnimatedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  backdropClassName?: string;
  containerId?: string;
  backdropId?: string;
  wrapperId?: string;
}

/**
 * Slide-down modal sheet drawer with backdrop blur overlay and smooth transitions.
 */
export function AnimatedDrawer({
  isOpen,
  onClose,
  title,
  children,
  className,
  backdropClassName,
  containerId = 'animated-drawer-container',
  backdropId = 'animated-drawer-backdrop',
  wrapperId = 'animated-drawer-wrapper',
}: AnimatedDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id={wrapperId} className="fixed inset-0 z-50 flex flex-col justify-start pointer-events-auto">
          <motion.div
            id={backdropId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className={cn('fixed inset-0 bg-black/40 backdrop-blur-xs z-40', backdropClassName)}
          />

          <motion.div
            id={containerId}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: '-100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={cn(
              'relative z-50 w-full max-h-[82vh] flex flex-col bg-card/95 backdrop-blur-xl border-b border-border shadow-2xl p-4 sm:p-6 text-foreground overflow-hidden',
              className
            )}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default AnimatedDrawer;

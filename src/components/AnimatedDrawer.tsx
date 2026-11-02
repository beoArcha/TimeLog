import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from '@components/ui/drawer';
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
  portalContainer?: HTMLElement | ShadowRoot | React.RefObject<HTMLElement | ShadowRoot | null> | null;
}

/**
 * Slide-down modal sheet drawer with backdrop blur overlay and smooth transitions.
 * Accessible drawer composite wrapping Base UI Drawer primitive.
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
  portalContainer,
}: AnimatedDrawerProps) {
  const lastCloseTimestampRef = React.useRef(0);

  const handleClose = React.useCallback(() => {
    const now = Date.now();
    if (now - lastCloseTimestampRef.current < 50) {
      return;
    }
    lastCloseTimestampRef.current = now;
    onClose();
  }, [onClose]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleClose();
        }
      }}
    >
      <DrawerContent
        id={containerId}
        side="top"
        showClose={false}
        backdropId={backdropId}
        backdropClassName={backdropClassName}
        onBackdropClick={handleClose}
        portalContainer={portalContainer}
        aria-label={title}
        aria-modal="true"
        className={cn(
          'w-full max-h-[82vh] flex flex-col p-4 sm:p-6 text-foreground overflow-hidden',
          className
        )}
      >
        {title && <DrawerTitle className="sr-only">{title}</DrawerTitle>}
        {children}
      </DrawerContent>
    </Drawer>
  );
}

export default AnimatedDrawer;

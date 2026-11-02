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
  wrapperId = 'animated-drawer-wrapper',
  portalContainer,
}: AnimatedDrawerProps) {
  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DrawerContent
        id={containerId}
        wrapperId={wrapperId}
        side="top"
        showClose={false}
        backdropId={backdropId}
        backdropClassName={backdropClassName}
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

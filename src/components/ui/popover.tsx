import * as React from 'react';
import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;
const PopoverTrigger = PopoverPrimitive.Trigger;
const PopoverPortal = PopoverPrimitive.Portal;
const PopoverClose = PopoverPrimitive.Close;
const PopoverTitle = PopoverPrimitive.Title;
const PopoverDescription = PopoverPrimitive.Description;

export interface PopoverContentProps extends PopoverPrimitive.Popup.Props {
  sideOffset?: number;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  positionerClassName?: string;
  anchor?: React.ComponentProps<typeof PopoverPrimitive.Positioner>['anchor'];
}

/**
 * Base UI popover content popup with positioner.
 */
function PopoverContent({
  className,
  positionerClassName,
  children,
  sideOffset = 4,
  align = 'center',
  side = 'bottom',
  anchor,
  ...props
}: PopoverContentProps) {
  return (
    <PopoverPortal>
      <PopoverPrimitive.Positioner
        anchor={anchor}
        sideOffset={sideOffset}
        align={align}
        side={side}
        className={cn('z-50', positionerClassName)}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            'relative z-50 min-w-[12rem] overflow-hidden rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-2xl outline-none',
            'animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPortal>
  );
}

const PopoverPositioner = PopoverPrimitive.Positioner;

export {
  Popover,
  PopoverTrigger,
  PopoverPositioner,
  PopoverPortal,
  PopoverContent,
  PopoverClose,
  PopoverTitle,
  PopoverDescription,
};

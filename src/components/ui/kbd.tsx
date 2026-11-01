import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { kbdVariants } from "./kbd-variants";

export interface KbdProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> {}

/**
 * Accessible keyboard shortcut key primitive with CVA variants.
 */
const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, variant, size, children, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        data-slot="kbd"
        className={cn(kbdVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </kbd>
    );
  }
);
Kbd.displayName = "Kbd";

export { Kbd };

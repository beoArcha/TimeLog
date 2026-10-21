import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { badgeVariants } from "./badge-variants";

export type BadgeProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof badgeVariants> & {
    as?: "div" | "span";
  };

/**
 * Visual status indicator badge primitive.
 */
function Badge({ className, variant, size, as = "div", ...props }: BadgeProps) {
  const Component = as;
  return (
    <Component
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge };

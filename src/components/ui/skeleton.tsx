import * as React from "react";
import { cn } from "@/lib/utils";

export type SkeletonProps = React.HTMLAttributes<HTMLElement> & {
  as?: "div" | "span";
};

/**
 * Placeholder shimmer component for loading states.
 */
function Skeleton({ className, as: Component = "div", ...props }: SkeletonProps) {
  return (
    <Component
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted/80", className)}
      {...props}
    />
  );
}

export { Skeleton };

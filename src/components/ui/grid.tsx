import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { gridVariants } from "./grid-variants";

export interface GridProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof gridVariants> {
  as?: "div" | "section" | "article";
}

export const Grid = React.forwardRef<HTMLElement, GridProps>(
  ({ className, cols, gap, align, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        ref={ref as never}
        data-slot="grid"
        className={cn(gridVariants({ cols, gap, align }), className)}
        {...props}
      />
    );
  }
);
Grid.displayName = "Grid";

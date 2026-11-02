import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { gridVariants } from "./grid-variants";

export interface GridProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof gridVariants> {
  /**
   * The HTML tag to render the grid container as.
   * Constrained to semantic block containers ('div', 'section', 'article').
   */
  as?: "div" | "section" | "article";
  /**
   * Number of columns in the grid.
   * Supported variants: 1, 2, 3, 4, 6, 12.
   */
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
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

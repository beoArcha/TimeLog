import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { stackVariants } from "./stack-variants";

export type StackProps = Omit<React.HTMLAttributes<HTMLElement>, "direction" | "wrap"> &
  VariantProps<typeof stackVariants> & {
    as?: "div" | "span" | "header" | "footer" | "section" | "nav" | "main" | "aside" | "ul" | "ol" | "li";
  };

/**
 * Base stack primitive supporting horizontal and vertical layouts.
 */
export const Stack = React.forwardRef<HTMLElement, StackProps>(
  ({ className, direction = "horizontal", align, justify, gap, wrap, inline, as: Component = "div", ...props }, ref) => {
    const resolvedDirection = (direction ?? "horizontal") as "horizontal" | "vertical";
    return (
      <Component
        ref={ref as never}
        data-slot="stack"
        className={cn(stackVariants({ direction: resolvedDirection, align, justify, gap, wrap, inline }), className)}
        {...props}
      />
    );
  }
);
Stack.displayName = "Stack";

/**
 * Horizontal flex row layout. Defaults to items-center and gap-sm (gap-2).
 */
export const HStack = React.forwardRef<HTMLElement, Omit<StackProps, "direction">>(
  ({ className, align = "center", as = "div", ...props }, ref) => {
    return (
      <Stack
        ref={ref}
        direction="horizontal"
        align={align}
        as={as}
        data-slot="hstack"
        className={className}
        {...props}
      />
    );
  }
);
HStack.displayName = "HStack";

/**
 * Vertical flex column layout. Defaults to items-stretch and gap-sm (gap-2).
 */
export const VStack = React.forwardRef<HTMLElement, Omit<StackProps, "direction">>(
  ({ className, align = "stretch", as = "div", ...props }, ref) => {
    return (
      <Stack
        ref={ref}
        direction="vertical"
        align={align}
        as={as}
        data-slot="vstack"
        className={className}
        {...props}
      />
    );
  }
);
VStack.displayName = "VStack";

/**
 * Inline horizontal cluster with wrapping enabled by default. Ideal for badges, tags, chip lists, button clusters.
 */
export const InlineCluster = React.forwardRef<HTMLElement, Omit<StackProps, "direction" | "inline">>(
  ({ className, align = "center", wrap = true, as = "div", ...props }, ref) => {
    return (
      <Stack
        ref={ref}
        direction="horizontal"
        align={align}
        wrap={wrap}
        inline={true}
        as={as}
        data-slot="inline-cluster"
        className={className}
        {...props}
      />
    );
  }
);
InlineCluster.displayName = "InlineCluster";

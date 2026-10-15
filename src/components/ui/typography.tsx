import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-sans font-bold tracking-tight text-foreground", {
  variants: {
    level: {
      1: "text-2xl sm:text-3xl font-extrabold",
      2: "text-xl sm:text-2xl font-bold",
      3: "text-lg sm:text-xl font-bold",
      4: "text-base sm:text-lg font-semibold",
      5: "text-sm sm:text-base font-semibold",
      6: "text-xs sm:text-sm font-semibold",
    },
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      primary: "text-primary",
      accent: "text-ring",
    },
  },
  defaultVariants: {
    level: 2,
    variant: "default",
  },
});

export type HeadingProps = React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants> & {
    as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  };

/**
 * Semantic heading component with typography scale variants.
 */
function Heading({ className, level = 2, variant, as, ...props }: HeadingProps) {
  const Component = as || (`h${level}` as const);
  return (
    <Component
      data-slot="heading"
      className={cn(headingVariants({ level, variant }), className)}
      {...props}
    />
  );
}

const textVariants = cva("font-sans leading-relaxed", {
  variants: {
    variant: {
      body: "text-sm text-foreground",
      muted: "text-xs text-muted-foreground",
      caption: "text-[11px] text-muted-foreground tracking-wide",
      mono: "font-mono text-xs",
      metric: "font-mono font-bold tracking-tight text-foreground",
      label: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
      error: "text-xs text-destructive font-medium",
      success: "text-xs text-emerald-600 dark:text-emerald-400 font-medium",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
      xl: "text-xl",
      "2xl": "text-2xl font-bold",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

export type TextProps = React.HTMLAttributes<HTMLElement> &
  VariantProps<typeof textVariants> & {
    as?: "p" | "span" | "div" | "small" | "strong" | "label";
  };

/**
 * General purpose typography primitive for paragraphs, captions, and text snippets.
 */
function Text({ className, variant, size, as = "p", ...props }: TextProps) {
  const Component = as;
  return (
    <Component
      data-slot="text"
      className={cn(textVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export type ListProps = React.HTMLAttributes<HTMLUListElement | HTMLOListElement> & {
  ordered?: boolean;
};

function List({ className, ordered = false, ...props }: ListProps) {
  const Component = ordered ? "ol" : "ul";
  return (
    <Component
      data-slot="list"
      className={cn(
        "space-y-1.5 pl-5 text-sm text-foreground",
        ordered ? "list-decimal" : "list-disc",
        className
      )}
      {...props}
    />
  );
}

function ListItem({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  return (
    <li
      data-slot="list-item"
      className={cn("leading-relaxed", className)}
      {...props}
    />
  );
}

export { Heading, Text, List, ListItem, headingVariants, textVariants };

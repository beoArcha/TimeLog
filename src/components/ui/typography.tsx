import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { headingVariants, textVariants } from "./typography-variants";

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

export { Heading, Text, List, ListItem };


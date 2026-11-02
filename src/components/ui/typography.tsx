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

/**
 * Dedicated subtext/caption primitive.
 * Defaults to 2xs (10px) text-muted-foreground leading-tight (the most common pattern in oXyFlow).
 */
function Caption({ className, variant = "caption", size = "2xs", as = "p", ...props }: TextProps) {
  return <Text as={as} variant={variant} size={size} className={className} {...props} />;
}

/**
 * Dedicated overline / section label primitive.
 * Defaults to uppercase tracking-wider 2xs (10px) font-semibold text-muted-foreground.
 */
function Overline({ className, variant = "label", size = "2xs", as = "span", ...props }: TextProps) {
  return <Text as={as} variant={variant} size={size} className={className} {...props} />;
}

/**
 * Dedicated monospace text primitive for tags, hashes, timestamps, durations, and counts.
 */
function MonoText({ className, variant = "mono", size = "2xs", as = "span", ...props }: TextProps) {
  return <Text as={as} variant={variant} size={size} className={className} {...props} />;
}

/**
 * Dedicated metric text primitive for KPI numbers, duration sums, and stat cards.
 */
function MetricText({ className, variant = "metric", size = "base", as = "span", ...props }: TextProps) {
  return <Text as={as} variant={variant} size={size} className={className} {...props} />;
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

/**
 * Phrasing semantic wrappers that inherit parent typography size/line-height.
 */
function Strong({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <strong
      data-slot="strong"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function Em({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <em
      data-slot="em"
      className={cn("italic text-foreground", className)}
      {...props}
    />
  );
}

function Mark({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <mark
      data-slot="mark"
      className={cn("bg-primary/20 text-foreground rounded-xs px-1", className)}
      {...props}
    />
  );
}

function Del({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <del
      data-slot="del"
      className={cn("line-through text-muted-foreground", className)}
      {...props}
    />
  );
}

function Ins({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <ins
      data-slot="ins"
      className={cn("underline text-foreground decoration-emerald-500", className)}
      {...props}
    />
  );
}

function Abbr({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <abbr
      data-slot="abbr"
      className={cn("underline decoration-dotted cursor-help", className)}
      {...props}
    />
  );
}

export {
  Heading,
  Text,
  Caption,
  Overline,
  MonoText,
  MetricText,
  List,
  ListItem,
  Strong,
  Em,
  Mark,
  Del,
  Ins,
  Abbr,
};

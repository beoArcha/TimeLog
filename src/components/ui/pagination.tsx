import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "./button";

/**
 * Main navigation container for pagination controls.
 */
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}

/**
 * List container for pagination items.
 */
function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}

/**
 * Individual item wrapper inside PaginationContent.
 */
function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("", className)}
      {...props}
    />
  );
}

export type PaginationLinkProps = {
  isActive?: boolean;
} & ButtonProps;

/**
 * Interactive link / button for navigating to a specific page.
 */
function PaginationLink({
  className,
  isActive,
  size = "icon-sm",
  variant,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      data-slot="pagination-link"
      aria-current={isActive ? "page" : undefined}
      variant={variant ?? (isActive ? "outline" : "ghost")}
      size={size}
      className={cn("font-mono", className)}
      {...props}
    />
  );
}

export type PaginationPreviousProps = React.ComponentProps<typeof PaginationLink> & {
  label?: string;
};

/**
 * Pagination button to navigate to the previous page.
 */
function PaginationPrevious({
  className,
  label = "Previous",
  "aria-label": ariaLabel,
  ...props
}: PaginationPreviousProps) {
  const resolvedAriaLabel = ariaLabel ?? (label === "Previous" ? "Go to previous page" : label);
  return (
    <PaginationLink
      aria-label={resolvedAriaLabel}
      size="sm"
      className={cn("gap-1 pl-2.5", className)}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span>{label}</span>
    </PaginationLink>
  );
}

export type PaginationNextProps = React.ComponentProps<typeof PaginationLink> & {
  label?: string;
};

/**
 * Pagination button to navigate to the next page.
 */
function PaginationNext({
  className,
  label = "Next",
  "aria-label": ariaLabel,
  ...props
}: PaginationNextProps) {
  const resolvedAriaLabel = ariaLabel ?? (label === "Next" ? "Go to next page" : label);
  return (
    <PaginationLink
      aria-label={resolvedAriaLabel}
      size="sm"
      className={cn("gap-1 pr-2.5", className)}
      {...props}
    >
      <span>{label}</span>
      <ChevronRight className="h-4 w-4" />
    </PaginationLink>
  );
}

/**
 * Ellipsis separator indicating additional hidden pages.
 */
function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex h-8 w-8 items-center justify-center text-muted-foreground", className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

export {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};

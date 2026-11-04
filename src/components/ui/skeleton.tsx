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

/**
 * Skeleton placeholder for stat counters and metric cards.
 */
function StatsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5 p-4 w-full animate-pulse", className)}>
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-7 w-28" />
    </div>
  );
}

/**
 * Skeleton placeholder for cards and list items using semantic theme tokens.
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3.5 p-4 border rounded-2xl w-full border-border bg-muted/60 animate-pulse", className)}>
      <Skeleton className="h-5 w-5 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-7 w-10 rounded-lg" />
    </div>
  );
}

/**
 * Skeleton placeholder for tabular layouts with configurable row count.
 */
function TableSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("w-full space-y-3.5", className)}>
      <div className="flex gap-4">
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-5 flex-1" />
        <Skeleton className="h-5 flex-1" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <Skeleton className="h-7 flex-1" />
          <Skeleton className="h-7 flex-1" />
          <Skeleton className="h-7 flex-1" />
        </div>
      ))}
    </div>
  );
}

export { Skeleton, StatsSkeleton, CardSkeleton, TableSkeleton };

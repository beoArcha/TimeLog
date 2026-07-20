import React, { useContext } from 'react';
import { cn } from '@/lib/utils';
import { SettingsContext } from '@common/hooks/SettingsContext';

interface SkeletonProps extends React.ComponentProps<'div'> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  const ctx = useContext(SettingsContext);
  const resolvedTheme = ctx?.resolvedTheme || 'dark';
  
  return (
    <div
      className={cn(
        "animate-pulse rounded-md",
        resolvedTheme === 'light'
          ? 'bg-[#EAE4DB]'
          : resolvedTheme === 'high-contrast'
          ? 'bg-black border border-white'
          : 'bg-slate-800/80',
        className
      )}
      {...props}
    />
  );
}

export function StatsSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 p-4 w-full animate-pulse">
      <Skeleton className="h-3 w-16" />
      <Skeleton className="h-7 w-28" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="flex items-center gap-3.5 p-4 border rounded-2xl w-full border-white/5 bg-slate-900/10">
      <Skeleton className="h-5 w-5 rounded" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-7 w-10 rounded-lg" />
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3.5">
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

import React from 'react';
import { cn } from '@/lib/utils';

export interface ReportMetricCardProps {
  key?: React.Key;
  testId: string;
  label: string;
  value: React.ReactNode;
  description?: string;
  valueClassName?: string;
}

/**
 * Reusable metric card displaying a single report statistic with consistent typography and tokens.
 */
export function ReportMetricCard({
  testId,
  label,
  value,
  description,
  valueClassName = 'text-foreground font-mono',
}: ReportMetricCardProps) {
  return (
    <div
      data-testid={testId}
      className="p-5 rounded-3xl border border-border bg-card shadow-xs transition-all flex flex-col justify-between"
    >
      <div>
        <p className="text-[10px] font-mono tracking-wider text-muted-foreground uppercase">{label}</p>
        <p className={cn('text-2xl font-extrabold tracking-tight mt-1', valueClassName)}>
          {value}
        </p>
      </div>
      {description && (
        <p className="text-[10px] text-muted-foreground mt-1 truncate">
          {description}
        </p>
      )}
    </div>
  );
}

export default ReportMetricCard;

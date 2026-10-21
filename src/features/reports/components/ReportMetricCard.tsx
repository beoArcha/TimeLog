import React from 'react';
import { cn } from '@/lib/utils';
import { Overline, MetricText, Caption } from '@components/ui/typography';

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
        <Overline>{label}</Overline>
        <MetricText size="2xl" weight="extrabold" className={cn('tracking-tight mt-1 block', valueClassName)}>
          {value}
        </MetricText>
      </div>
      {description && (
        <Caption className="mt-1 truncate block">
          {description}
        </Caption>
      )}
    </div>
  );
}

export default ReportMetricCard;

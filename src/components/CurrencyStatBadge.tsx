import React from 'react';
import { Badge, type BadgeProps } from '@components/ui/badge';
import { cn } from '@/lib/utils';

export interface CurrencyStatBadgeProps {
  currency?: string | null;
  amount?: string | number | null;
  rateStatus?: 'billable' | 'non_billable' | 'unconfigured' | 'custom' | 'inherited' | string | null;
  variant?: BadgeProps['variant'];
  size?: BadgeProps['size'];
  className?: string;
  testId?: string;
}

function resolveStatusVariant(rateStatus?: string | null): BadgeProps['variant'] {
  if (rateStatus === 'non_billable') return 'muted';
  if (rateStatus === 'unconfigured') return 'amber';
  if (rateStatus === 'custom') return 'emerald';
  if (rateStatus === 'inherited') return 'outline';
  return 'secondary';
}

function resolveDisplayText(
  currency?: string | null,
  amount?: string | number | null,
  rateStatus?: string | null
): string {
  if (amount !== undefined && amount !== null) {
    return currency ? `${amount} ${currency}` : `${amount}`;
  }
  if (currency) {
    return currency;
  }
  if (rateStatus) {
    return rateStatus;
  }
  return '';
}

/**
 * Composite currency badge component adhering to Design System.
 * Formats currency code, amounts, and rate status flags with semantic token variants.
 */
export function CurrencyStatBadge({
  currency,
  amount,
  rateStatus,
  variant,
  size = 'xs',
  className,
  testId,
}: CurrencyStatBadgeProps) {
  const resolvedVariant = variant ?? resolveStatusVariant(rateStatus);
  const displayText = resolveDisplayText(currency, amount, rateStatus);

  if (!displayText) {
    return null;
  }

  return (
    <Badge
      variant={resolvedVariant}
      size={size}
      className={cn('font-mono font-medium tracking-tight uppercase', className)}
      data-testid={testId}
    >
      {displayText}
    </Badge>
  );
}

export default CurrencyStatBadge;

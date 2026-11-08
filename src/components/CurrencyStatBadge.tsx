import React from 'react';
import type { RateStatus } from '@bindings/RateStatus';
import type { Locale } from '@bindings/Locale';
import { Badge, type BadgeProps } from '@components/ui/badge';
import { cn } from '@/lib/utils';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';
import type { CommonKey } from '@common/i18n/keys/common';

export type { RateStatus };

export interface CurrencyStatBadgeProps {
  currency?: string | null;
  amount?: string | number | null;
  rateStatus?: RateStatus | null;
  variant?: BadgeProps['variant'];
  size?: BadgeProps['size'];
  className?: string;
  testId?: string;
}

const RATE_STATUS_VARIANT_MAP: Record<RateStatus, BadgeProps['variant']> = {
  non_billable: 'muted',
  unconfigured: 'amber',
  custom: 'emerald',
  inherited: 'outline',
};

const RATE_STATUS_I18N_MAP: Record<RateStatus, CommonKey> = {
  inherited: 'RateStatusInherited',
  custom: 'RateStatusCustom',
  non_billable: 'RateStatusNonBillable',
  unconfigured: 'RateStatusUnconfigured',
};

function resolveStatusVariant(rateStatus?: RateStatus | null): BadgeProps['variant'] {
  if (!rateStatus) return 'secondary';
  return RATE_STATUS_VARIANT_MAP[rateStatus] ?? 'secondary';
}

function parseAmount(amount?: string | number | null): number | null {
  if (amount === null || amount === undefined) {
    return null;
  }
  if (typeof amount === 'number') {
    return Number.isFinite(amount) ? amount : null;
  }
  const trimmed = amount.trim();
  if (trimmed === '') {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatAmount(
  amount: number,
  locale: Locale,
  currency?: string | null
): string {
  const safeLocale = locale === 'custom' || locale === 'system' ? 'en' : locale;
  const cleanCurrency = currency?.trim();
  if (cleanCurrency) {
    try {
      return new Intl.NumberFormat(safeLocale, {
        style: 'currency',
        currency: cleanCurrency,
      }).format(amount);
    } catch {
      // Graceful fallback for non-standard currency codes
      const formattedNum = new Intl.NumberFormat(safeLocale).format(amount);
      return `${formattedNum} ${cleanCurrency.toUpperCase()}`;
    }
  }
  return new Intl.NumberFormat(safeLocale).format(amount);
}

function resolveDisplayText(
  currency: string | null | undefined,
  amount: string | number | null | undefined,
  rateStatus: RateStatus | null | undefined,
  locale: Locale,
  customTranslations?: Record<string, unknown>
): string {
  const parsed = parseAmount(amount);
  if (parsed !== null) {
    return formatAmount(parsed, locale, currency);
  }

  // Handle non-numeric amount string if provided
  if (amount !== undefined && amount !== null && typeof amount === 'string' && amount.trim() !== '') {
    const cleanCurr = currency?.trim();
    return cleanCurr ? `${amount.trim()} ${cleanCurr.toUpperCase()}` : amount.trim();
  }

  const cleanCurrency = currency?.trim();
  if (cleanCurrency) {
    return cleanCurrency.toUpperCase();
  }

  if (rateStatus && rateStatus in RATE_STATUS_I18N_MAP) {
    return translate(locale, 'common', RATE_STATUS_I18N_MAP[rateStatus], customTranslations);
  }

  return '';
}

/**
 * Badge displaying formatted currency amounts, currency codes, or billing rate status.
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
  const { locale, customTranslations } = useSafeLocale();
  const resolvedVariant = variant ?? resolveStatusVariant(rateStatus);
  const displayText = resolveDisplayText(
    currency,
    amount,
    rateStatus,
    locale,
    customTranslations as Record<string, unknown>
  );

  if (!displayText) {
    return null;
  }

  return (
    <Badge
      variant={resolvedVariant}
      size={size}
      className={cn('font-mono font-medium tracking-tight', className)}
      data-testid={testId}
    >
      {displayText}
    </Badge>
  );
}

export default CurrencyStatBadge;

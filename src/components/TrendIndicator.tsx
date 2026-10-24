import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HStack } from '@components/ui/stack';
import { MonoText } from '@components/ui/typography';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';

export type TrendDirection = 'up' | 'down' | 'neutral';

export interface TrendIndicatorProps {
  value: string | number;
  direction?: TrendDirection;
  label?: string;
  className?: string;
}

const DIRECTION_COLOR_MAP: Record<TrendDirection, string> = {
  up: 'text-emerald-500',
  down: 'text-rose-500',
  neutral: 'text-muted-foreground',
};

const DIRECTION_I18N_MAP: Record<TrendDirection, 'TrendIncrease' | 'TrendDecrease' | 'TrendNeutral'> = {
  up: 'TrendIncrease',
  down: 'TrendDecrease',
  neutral: 'TrendNeutral',
};

/**
 * Reusable trend indicator displaying an icon, metric change value, and accessible label.
 */
export function TrendIndicator({
  value,
  direction = 'neutral',
  label,
  className,
}: TrendIndicatorProps) {
  const { locale, customTranslations } = useSafeLocale();

  const trendDirectionLabel = translate(
    locale,
    'common',
    DIRECTION_I18N_MAP[direction] ?? 'TrendNeutral',
    customTranslations
  );

  const ariaLabel = label || `${trendDirectionLabel}: ${value}`;

  return (
    <HStack
      as="span"
      gap="2xs"
      aria-label={ariaLabel}
      className={cn(
        'font-medium inline-flex items-center',
        DIRECTION_COLOR_MAP[direction],
        className
      )}
    >
      {direction === 'up' && <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      {direction === 'down' && <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      {direction === 'neutral' && <Minus className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <MonoText as="span" size="xs" className="font-semibold text-inherit">
        {value}
      </MonoText>
    </HStack>
  );
}

export default TrendIndicator;

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HStack } from '@components/ui/stack';
import { MonoText } from '@components/ui/typography';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';

export type TrendDirection = 'up' | 'down' | 'neutral';
export type TrendSentiment = 'positive' | 'negative' | 'neutral';

export interface TrendIndicatorProps {
  value: string | number;
  direction?: TrendDirection;
  sentiment?: TrendSentiment;
  label?: string;
  className?: string;
  testId?: string;
}

const DEFAULT_SENTIMENT_BY_DIRECTION: Record<TrendDirection, TrendSentiment> = {
  up: 'positive',
  down: 'negative',
  neutral: 'neutral',
};

const SENTIMENT_COLOR_MAP: Record<TrendSentiment, string> = {
  positive: 'text-success',
  negative: 'text-destructive',
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
  sentiment,
  label,
  className,
  testId,
}: TrendIndicatorProps) {
  const { locale, customTranslations } = useSafeLocale();

  const resolvedSentiment = sentiment ?? DEFAULT_SENTIMENT_BY_DIRECTION[direction];

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
      role="img"
      aria-label={ariaLabel}
      data-testid={testId}
      data-direction={direction}
      data-sentiment={resolvedSentiment}
      gap="2xs"
      className={cn(
        'font-medium inline-flex items-center',
        SENTIMENT_COLOR_MAP[resolvedSentiment],
        className
      )}
    >
      {direction === 'up' && (
        <TrendingUp
          className="w-3.5 h-3.5 shrink-0"
          aria-hidden="true"
          data-testid={testId ? `${testId}-icon-up` : undefined}
        />
      )}
      {direction === 'down' && (
        <TrendingDown
          className="w-3.5 h-3.5 shrink-0"
          aria-hidden="true"
          data-testid={testId ? `${testId}-icon-down` : undefined}
        />
      )}
      {direction === 'neutral' && (
        <Minus
          className="w-3.5 h-3.5 shrink-0"
          aria-hidden="true"
          data-testid={testId ? `${testId}-icon-neutral` : undefined}
        />
      )}
      <MonoText as="span" size="xs" className="font-semibold text-inherit">
        {value}
      </MonoText>
    </HStack>
  );
}

export default TrendIndicator;
import React from 'react';
import { Card } from '@components/ui/card';
import { Heading, Text } from '@components/ui/typography';
import { Badge } from '@components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';

export interface StatCardTrend {
  value: string | number;
  direction?: 'up' | 'down' | 'neutral';
  label?: string;
}

export interface StatCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon?: LucideIcon | React.ElementType;
  iconColor?: string;
  badge?: React.ReactNode;
  trend?: StatCardTrend;
  className?: string;
  onClick?: () => void;
  testId?: string;
}

/**
 * Metric card displaying a primary value, optional icon, badge, trend, and description.
 */
export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  badge,
  trend,
  className,
  onClick,
  testId,
}: StatCardProps) {
  const { locale, customTranslations } = useSafeLocale();

  const resolveTrendLabel = () => {
    if (!trend) return '';
    const trendKeyMap: Record<string, 'TrendIncrease' | 'TrendDecrease' | 'TrendNeutral'> = {
      up: 'TrendIncrease',
      down: 'TrendDecrease',
      neutral: 'TrendNeutral',
    };
    const key = trendKeyMap[trend.direction] ?? 'TrendNeutral';
    return translate(locale, 'common', key, customTranslations);
  };
  const trendDirectionLabel = resolveTrendLabel();

  const trendAria = trend
    ? trend.label || `${trendDirectionLabel}: ${trend.value}`
    : undefined;

  return (
    <Card
      data-testid={testId}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        'p-5 transition-all flex flex-col justify-between gap-3 bg-card border-border text-card-foreground',
        onClick &&
          'cursor-pointer hover:border-primary/40 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1 min-w-0">
          <Text variant="muted" className="truncate uppercase font-medium tracking-wider text-xs">
            {title}
          </Text>
          <div className="flex items-baseline gap-2">
            <Heading level={2} className="text-2xl font-bold tracking-tight font-mono">
              {value}
            </Heading>
            {badge && (typeof badge === 'string' ? <Badge variant="secondary">{badge}</Badge> : badge)}
          </div>
        </div>

        {Icon && (
          <div
            aria-hidden="true"
            className={cn(
              'p-2.5 rounded-xl bg-muted/60 text-muted-foreground shrink-0 border border-border/50',
              iconColor
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(description || trend) && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/40 text-xs">
          {trend && (
            <span
              aria-label={trendAria}
              className={cn(
                'inline-flex items-center gap-0.5 font-medium',
                trend.direction === 'up' && 'text-emerald-500',
                trend.direction === 'down' && 'text-rose-500',
                trend.direction === 'neutral' && 'text-muted-foreground'
              )}
            >
              {trend.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" />}
              {trend.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
              {trend.direction === 'neutral' && <Minus className="w-3.5 h-3.5" aria-hidden="true" />}
              <span>{trend.value}</span>
            </span>
          )}
          {description && (
            <Text variant="caption" className="text-muted-foreground truncate">
              {description}
            </Text>
          )}
        </div>
      )}
    </Card>
  );
}

export default StatCard;

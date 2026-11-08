import React from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { MetricText, Text, Caption } from '@components/ui/typography';
import { Badge } from '@components/ui/badge';
import { HStack, VStack } from '@components/ui/stack';
import { IconBox } from '@components/ui/icon-box';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendIndicator, type TrendDirection, type TrendSentiment } from './TrendIndicator';

export interface StatCardTrend {
  value: string | number;
  direction?: TrendDirection;
  sentiment?: TrendSentiment;
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
export const StatCard: React.FC<StatCardProps> = ({
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
}) => {
  const cardContent = (
    <>
      <HStack as="span" align="start" justify="between" gap="md" className="w-full">
        <VStack as="span" gap="2xs" className="min-w-0 text-left">
          <Text
            as="span"
            variant="muted"
            className="uppercase font-medium tracking-wider text-xs leading-tight line-clamp-2 break-words"
          >
            {title}
          </Text>
          <HStack as="span" align="baseline" gap="xs">
            <MetricText as="span" size="2xl" className="tracking-tight">
              {value}
            </MetricText>
            {badge && (typeof badge === 'string' ? <Badge as="span" variant="secondary">{badge}</Badge> : badge)}
          </HStack>
        </VStack>

        {Icon && (
          <IconBox
            as="span"
            aria-hidden="true"
            variant="muted"
            size="md"
            rounded="lg"
            className={cn('border-border/50 shrink-0', iconColor)}
          >
            <Icon className="w-5 h-5" />
          </IconBox>
        )}
      </HStack>

      {(description || trend) && (
        <HStack as="span" gap="xs" className="pt-1 border-t border-border/40 text-xs w-full">
          {trend && (
            <TrendIndicator
              value={trend.value}
              direction={trend.direction}
              sentiment={trend.sentiment}
              label={trend.label}
            />
          )}
          {description && (
            <Caption as="span" size="2xs" className="text-muted-foreground truncate">
              {description}
            </Caption>
          )}
        </HStack>
      )}
    </>
  );

  if (onClick) {
    return (
      <Button
        data-testid={testId}
        type="button"
        variant="ghost"
        onClick={onClick}
        className={cn(
          'group/card p-5 h-auto w-full text-left font-normal transition-all flex flex-col justify-between items-stretch gap-3 bg-card border border-border text-card-foreground rounded-xl shadow-xs cursor-pointer hover:border-primary/40 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring whitespace-normal',
          className
        )}
      >
        {cardContent}
      </Button>
    );
  }

  return (
    <Card
      data-testid={testId}
      className={cn(
        'p-5 transition-all flex flex-col justify-between gap-3 bg-card border-border text-card-foreground',
        className
      )}
    >
      {cardContent}
    </Card>
  );
}

export default StatCard;


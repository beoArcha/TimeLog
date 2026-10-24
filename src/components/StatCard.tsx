import React from 'react';
import { Card } from '@components/ui/card';
import { MetricText, Text, Caption } from '@components/ui/typography';
import { Badge } from '@components/ui/badge';
import { HStack, VStack } from '@components/ui/stack';
import { IconBox } from '@components/ui/icon-box';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { TrendIndicator, type TrendDirection } from './TrendIndicator';

export interface StatCardTrend {
  value: string | number;
  direction?: TrendDirection;
  label?: string;
}

export interface StatCardProps {
  key?: React.Key;
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
      <HStack align="start" justify="between" gap="md">
        <VStack gap="2xs" className="min-w-0">
          <Text variant="muted" className="uppercase font-medium tracking-wider text-xs leading-tight line-clamp-2 break-words">
            {title}
          </Text>
          <HStack align="baseline" gap="xs">
            <MetricText size="2xl" className="tracking-tight">
              {value}
            </MetricText>
            {badge && (typeof badge === 'string' ? <Badge variant="secondary">{badge}</Badge> : badge)}
          </HStack>
        </VStack>

        {Icon && (
          <IconBox
            aria-hidden="true"
            variant="muted"
            size="md"
            rounded="lg"
            className={cn('border-border/50', iconColor)}
          >
            <Icon className="w-5 h-5" />
          </IconBox>
        )}
      </HStack>

      {(description || trend) && (
        <HStack gap="xs" className="pt-1 border-t border-border/40 text-xs">
          {trend && (
            <TrendIndicator
              value={trend.value}
              direction={trend.direction}
              label={trend.label}
            />
          )}
          {description && (
            <Caption size="2xs" className="text-muted-foreground truncate">
              {description}
            </Caption>
          )}
        </HStack>
      )}
    </Card>
  );
}

export default StatCard;


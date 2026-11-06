import React, { useId, useState } from 'react';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { HStack, VStack } from '@components/ui/stack';
import { Heading } from '@components/ui/typography';
import { cn } from '@/lib/utils';

export interface CollapsibleCardProps {
  title?: React.ReactNode;
  icon?: LucideIcon | React.ElementType;
  iconColor?: string;
  titleColor?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  headerRight?: React.ReactNode;
  wrapperClassName?: string;
  headerClassName?: string;
  contentClassName?: string;
  titleNode?: React.ReactNode;
  onClick?: () => void;
  headerTestId?: string;
}

/**
 * Collapsible card with a semantic header trigger and independently interactive actions.
 */
export function CollapsibleCard({
  title,
  icon: Icon,
  iconColor,
  titleColor,
  children,
  defaultExpanded = true,
  headerRight,
  wrapperClassName,
  headerClassName,
  contentClassName,
  titleNode,
  onClick,
  headerTestId,
}: CollapsibleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentId = `collapsible-content-${useId()}`;

  const defaultWrapper = cn(
    'p-6 rounded-3xl border transition-all flex flex-col gap-4 bg-card border-border text-card-foreground shadow-xs'
  );
  const defaultHeader = cn(
    'text-sm font-bold flex items-center gap-2',
    titleColor || 'text-foreground'
  );

  const handleToggle = () => {
    setIsExpanded((current) => !current);
    onClick?.();
  };

  return (
    <Card
      className={wrapperClassName || defaultWrapper}
      data-slot="collapsible-card"
    >
      <HStack justify="between" align="center" className="w-full">
        <HStack align="center" gap="xs" className="min-w-0 flex-1">
          {Icon && (
            <Icon
              className={cn('w-4 h-4 shrink-0', iconColor || 'text-muted-foreground')}
              aria-hidden="true"
            />
          )}
          <Heading level={3} className={cn(defaultHeader, 'min-w-0 flex-1', headerClassName)}>
            <Button
              type="button"
              variant="ghost"
              onClick={handleToggle}
              aria-expanded={isExpanded}
              aria-controls={contentId}
              data-testid={headerTestId}
              className="h-auto w-full justify-between rounded-md px-1 py-1 text-left text-inherit hover:bg-muted/40"
            >
              <span className="min-w-0">{titleNode ?? title}</span>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              )}
            </Button>
          </Heading>
        </HStack>
        {headerRight && (
          <HStack align="center" gap="sm" className="shrink-0">
            {headerRight}
          </HStack>
        )}
      </HStack>

      <VStack
        id={contentId}
        hidden={!isExpanded}
        className={cn('animate-in fade-in slide-in-from-top-2 duration-300', contentClassName)}
      >
        {children}
      </VStack>
    </Card>
  );
}

export default CollapsibleCard;

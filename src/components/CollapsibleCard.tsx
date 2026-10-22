import React, { useState } from 'react';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { Card } from '@components/ui/card';
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
 * Collapsible card with header toggle and expandable body section.
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

  const defaultWrapper = cn(
    'p-6 rounded-3xl border transition-all flex flex-col gap-4 bg-card border-border text-card-foreground shadow-xs'
  );
  const defaultHeader = cn(
    'text-sm font-bold flex items-center gap-2',
    titleColor || 'text-foreground'
  );

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (onClick) onClick();
  };

  return (
    <Card
      className={wrapperClassName || defaultWrapper}
      data-slot="collapsible-card"
    >
      <HStack
        role="button"
        tabIndex={0}
        justify="between"
        align="center"
        className="cursor-pointer select-none"
        onClick={handleToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggle();
          }
        }}
        aria-expanded={isExpanded}
        aria-controls={`collapsible-content-${headerTestId ?? 'card'}`}
        data-testid={headerTestId}
      >
        <HStack align="center" gap="xs">
          {Icon && <Icon className={cn('w-4 h-4', iconColor || 'text-muted-foreground')} />}
          {titleNode ? (
            titleNode
          ) : (
            <Heading level={3} className={headerClassName || defaultHeader}>{title}</Heading>
          )}
        </HStack>
        <HStack align="center" gap="sm">
          {headerRight && <div onClick={(e) => e.stopPropagation()}>{headerRight}</div>}
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          )}
        </HStack>
      </HStack>

      {isExpanded && (
        <VStack
          id={`collapsible-content-${headerTestId ?? 'card'}`}
          className={cn('animate-in fade-in slide-in-from-top-2 duration-300', contentClassName)}
        >
          {children}
        </VStack>
      )}
    </Card>
  );
}

export default CollapsibleCard;

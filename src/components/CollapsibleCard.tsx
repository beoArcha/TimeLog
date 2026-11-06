import React from 'react';
import { ChevronDown, ChevronRight, type LucideIcon } from 'lucide-react';
import { Card } from '@components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@components/ui/collapsible';
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
 * Collapsible card using the shared accessible disclosure primitive.
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
  const defaultWrapper = cn(
    'p-6 rounded-3xl border transition-all flex flex-col gap-4 bg-card border-border text-card-foreground shadow-xs'
  );
  const defaultHeader = cn(
    'text-sm font-bold flex items-center gap-2',
    titleColor || 'text-foreground'
  );

  return (
    <Card
      className={wrapperClassName || defaultWrapper}
      data-slot="collapsible-card"
    >
      <Collapsible
        defaultOpen={defaultExpanded}
        onOpenChange={() => onClick?.()}
        className="flex flex-col gap-4"
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
              <CollapsibleTrigger
                data-testid={headerTestId}
                render={(triggerProps, state) => (
                  <Button
                    {...triggerProps}
                    type="button"
                    variant="ghost"
                    icon={
                      state.open ? (
                        <ChevronDown className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                      )
                    }
                    iconPlacement="right"
                    className="h-auto w-full justify-between rounded-md px-1 py-1 text-left text-inherit hover:bg-muted/40"
                  >
                    {titleNode ?? title}
                  </Button>
                )}
              />
            </Heading>
          </HStack>
          {headerRight && (
            <HStack align="center" gap="sm" className="shrink-0">
              {headerRight}
            </HStack>
          )}
        </HStack>

        <CollapsibleContent
          keepMounted
          className={cn('animate-in fade-in slide-in-from-top-2 duration-300', contentClassName)}
        >
          <VStack>{children}</VStack>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default CollapsibleCard;

import React from 'react';
import { Heading, Text } from '@components/ui/typography';
import { Button } from '@components/ui/button';
import { IconBox } from '@components/ui/icon-box';
import { VStack } from '@components/ui/stack';
import { Inbox, type LucideIcon } from 'lucide-react';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';
import { cn } from '@/lib/utils';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon | React.ElementType;
  variant?: 'default' | 'secondary' | 'outline';
}

export interface EmptyStateProps {
  icon?: LucideIcon | React.ElementType;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: EmptyStateAction | React.ReactNode;
  className?: string;
}

/**
 * Empty state placeholder displayed when a view or section contains no data.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const { locale, customTranslations } = useSafeLocale();
  const resolvedTitle = title || translate(locale, 'common', 'NoData', customTranslations);

  return (
    <VStack
      role="status"
      aria-live="polite"
      data-slot="empty-state"
      align="center"
      justify="center"
      className={cn(
        'p-8 text-center rounded-2xl border border-dashed border-border/70 bg-card/40 my-4',
        className
      )}
    >
      <IconBox
        variant="subtle"
        size="lg"
        className="rounded-2xl bg-muted/70 text-muted-foreground mb-3 border border-border/40"
        aria-hidden="true"
      >
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </IconBox>

      <Heading level={4} className="text-sm font-semibold text-foreground">
        {resolvedTitle}
      </Heading>

      {description && (
        <Text variant="muted" className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
          {description}
        </Text>
      )}

      {action && (
        <div className="mt-2">
          {React.isValidElement(action) ? (
            action
          ) : (
            <Button
              variant={(action as EmptyStateAction).variant || 'default'}
              size="sm"
              onClick={(action as EmptyStateAction).onClick}
            >
              {(action as EmptyStateAction).icon && (
                <span className="mr-1.5" aria-hidden="true">
                  {React.createElement((action as EmptyStateAction).icon!, { className: 'w-4 h-4' })}
                </span>
              )}
              {(action as EmptyStateAction).label}
            </Button>
          )}
        </div>
      )}
    </VStack>
  );
}

export default EmptyState;

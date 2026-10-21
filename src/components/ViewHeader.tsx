import React from 'react';
import { type LucideIcon } from 'lucide-react';
import { Heading, Text } from '@components/ui/typography';
import { cn } from '@/lib/utils';

export interface ViewHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  badge?: React.ReactNode;
  icon?: LucideIcon | React.ElementType;
  iconColor?: string;
  actions?: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Composite header component for views and tabs, with badge, title, icon, description, and action controls.
 */
export function ViewHeader({
  title,
  description,
  badge,
  icon: Icon,
  iconColor = 'text-primary',
  actions,
  className,
  testId,
}: ViewHeaderProps) {
  return (
    <div
      data-slot="view-header"
      data-testid={testId}
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors',
        className
      )}
    >
      <div className="flex flex-col text-left">
        {badge && <div className="mb-1.5 w-fit">{badge}</div>}
        <Heading
          level={2}
          className="font-sans font-bold text-2xl flex items-center gap-2.5 text-foreground leading-tight"
        >
          {Icon && (
            <Icon
              className={cn('w-6 h-6 shrink-0', iconColor)}
              aria-hidden="true"
            />
          )}
          <span>{title}</span>
        </Heading>
        {description && (
          <Text size="sm" variant="muted" className="mt-1 max-w-2xl leading-relaxed">
            {description}
          </Text>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  );
}

export default ViewHeader;

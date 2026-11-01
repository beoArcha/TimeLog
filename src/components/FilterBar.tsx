import React from 'react';
import { HStack, VStack, InlineCluster } from '@components/ui/stack';
import { SearchInput } from '@components/ui/search-input';
import { cn } from '@/lib/utils';

export interface FilterBarSearchProps {
  value: string;
  onChange: (val: string) => void;
  onClear?: () => void;
  placeholder?: string;
  ariaLabel?: string;
}

export interface FilterBarProps {
  children?: React.ReactNode;
  search?: FilterBarSearchProps;
  rightActions?: React.ReactNode;
  className?: string;
  testId?: string;
}

/**
 * Composite filtering toolbar for data tables, lists, and analytics views.
 */
export function FilterBar({
  children,
  search,
  rightActions,
  className,
  testId,
}: FilterBarProps) {
  return (
    <VStack
      data-slot="filter-bar"
      data-testid={testId}
      gap="md"
      className={cn(
        'p-4 rounded-2xl border border-border bg-muted/40 text-left transition-colors',
        className
      )}
    >
      <HStack
        align="center"
        justify="between"
        gap="md"
        className="flex-col md:flex-row w-full flex-wrap"
      >
        {search && (
          <div className="w-full sm:max-w-xs shrink-0">
            <SearchInput
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              onClear={search.onClear}
              placeholder={search.placeholder}
              searchAriaLabel={search.ariaLabel}
            />
          </div>
        )}

        {children && (
          <InlineCluster gap="sm" align="center" className="flex-1">
            {children}
          </InlineCluster>
        )}

        {rightActions && (
          <HStack gap="sm" align="center" className="shrink-0 self-start md:self-auto ml-auto">
            {rightActions}
          </HStack>
        )}
      </HStack>
    </VStack>
  );
}

export default FilterBar;

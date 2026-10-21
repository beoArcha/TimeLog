import React from 'react';
import { SearchInput } from './SearchInput';
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
    <div
      data-slot="filter-bar"
      data-testid={testId}
      className={cn(
        'p-4 rounded-2xl border border-border bg-muted/40 flex flex-col gap-4 text-left transition-colors',
        className
      )}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          <div className="flex-1 flex flex-wrap items-center gap-3">
            {children}
          </div>
        )}

        {rightActions && (
          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto ml-auto">
            {rightActions}
          </div>
        )}
      </div>
    </div>
  );
}

export default FilterBar;

import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group';
import { Tooltip, TooltipTrigger, TooltipContent } from '@components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import type { UiSize } from '@common/types/designSystem';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label?: React.ReactNode;
  icon?: LucideIcon | React.ElementType;
  tooltip?: string;
  ariaLabel?: string;
  disabled?: boolean;
  testId?: string;
  title?: string;
  className?: string;
}

export type SegmentedControlSize = UiSize;

export interface SegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  size?: SegmentedControlSize;
  className?: string;
  optionClassName?: string;
  groupAriaLabel?: string;
  id?: string;
}

const SIZE_CLASSES: Record<SegmentedControlSize, string> = {
  xs: 'text-xs h-6 px-1.5 sm:px-2 py-0.5 gap-1',
  sm: 'text-xs h-7 px-2 py-0.5 gap-1.5',
  md: 'text-xs h-8 px-2.5 py-1 gap-2',
  lg: 'text-sm h-9 px-3 py-1.5 gap-2.5',
  xl: 'text-base h-10 px-4 py-2 gap-3',
};

/**
 * Segmented control for toggling between mutually exclusive options.
 */
export function SegmentedControl<T extends string = string>({
  value,
  onChange,
  options,
  size = 'sm',
  className,
  optionClassName,
  groupAriaLabel,
  id,
}: SegmentedControlProps<T>) {
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(val) => {
        if (val && val.length > 0) {
          const next = val[val.length - 1] as unknown as T;
          if (next !== value) {
            onChange(next);
          }
        }
      }}
      variant="ghost"
      size={size}
      id={id}
      aria-label={groupAriaLabel}
      className={cn(
        'inline-flex items-center p-0.5 rounded-lg border border-border bg-muted/40 transition-colors',
        className
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const itemLabel =
          option.ariaLabel || (typeof option.label === 'string' ? option.label : option.value);
        const isSelected = value === option.value;

        const itemContent = (
          <ToggleGroupItem
            value={option.value}
            disabled={option.disabled}
            aria-label={itemLabel}
            aria-checked={isSelected}
            aria-pressed={isSelected}
            data-testid={option.testId}
            title={option.title}
            onClick={() => {
              onChange(option.value);
            }}
            className={cn(
              'rounded-md font-medium uppercase tracking-wider transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer',
              sizeClasses,
              isSelected
                ? 'bg-card text-foreground shadow-xs font-bold border border-border/80 data-[pressed]:bg-card data-[pressed]:text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent shadow-none bg-transparent data-[pressed]:bg-transparent',
              optionClassName,
              option.className
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
            {typeof option.label === 'string' ? <span>{option.label}</span> : option.label}
          </ToggleGroupItem>
        );

        if (option.tooltip) {
          return (
            <React.Fragment key={option.value}>
              <Tooltip>
                <TooltipTrigger render={itemContent} />
                <TooltipContent>{option.tooltip}</TooltipContent>
              </Tooltip>
            </React.Fragment>
          );
        }

        return <React.Fragment key={option.value}>{itemContent}</React.Fragment>;
      })}
    </ToggleGroup>
  );
}

export default SegmentedControl;

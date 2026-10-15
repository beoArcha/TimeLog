import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@components/ui/toggle-group';
import { Tooltip, TooltipTrigger, TooltipContent } from '@components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label?: React.ReactNode;
  icon?: LucideIcon | React.ElementType;
  tooltip?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  optionClassName?: string;
  groupAriaLabel?: string;
  id?: string;
}

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
  const sizeClasses = {
    sm: 'text-[10px] h-7 px-2 py-0.5 gap-1.5',
    md: 'text-xs h-8 px-2.5 py-1 gap-2',
    lg: 'text-sm h-9 px-3 py-1.5 gap-2.5',
  }[size];

  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(val) => {
        if (val && val.length > 0) {
          onChange(val[val.length - 1] as unknown as T);
        }
      }}
      id={id}
      aria-label={groupAriaLabel}
      className={cn(
        'inline-flex p-0.5 rounded-lg border border-border bg-muted/60 transition-colors',
        className
      )}
    >
      {options.map((option) => {
        const Icon = option.icon;
        const itemLabel =
          option.ariaLabel || (typeof option.label === 'string' ? option.label : option.value);

        const itemContent = (
          <ToggleGroupItem
            value={option.value}
            disabled={option.disabled}
            aria-label={itemLabel}
            aria-checked={value === option.value}
            className={cn(
              'rounded-md font-medium uppercase tracking-wider transition-all select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              sizeClasses,
              value === option.value
                ? 'bg-card text-foreground shadow-xs font-bold border border-border'
                : 'text-muted-foreground hover:text-foreground',
              optionClassName
            )}
          >
            {Icon && <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
            {option.label && <span>{option.label}</span>}
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

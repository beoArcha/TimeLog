import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Input, type InputProps } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { useSafeLocale } from '@common/hooks/LocaleProvider';
import { translate } from '@common/i18n/translator';
import { cn } from '@/lib/utils';

export interface SearchInputProps extends Omit<InputProps, 'type'> {
  onClear?: () => void;
  containerClassName?: string;
  clearAriaLabel?: string;
  searchAriaLabel?: string;
}

/**
 * Search input field with leading search icon and optional clear button.
 */
export function SearchInput({
  value,
  onChange,
  onClear,
  placeholder,
  clearAriaLabel,
  searchAriaLabel,
  containerClassName,
  className,
  onKeyDown,
  ...props
}: SearchInputProps) {
  const { locale, customTranslations } = useSafeLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const hasValue = Boolean(value && String(value).length > 0);

  const resolvedPlaceholder = placeholder || translate(locale, 'common', 'Search', customTranslations);
  const resolvedClearLabel = clearAriaLabel || translate(locale, 'common', 'ClearSearch', customTranslations);
  const resolvedSearchLabel = searchAriaLabel || resolvedPlaceholder;

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      const syntheticEvent = {
        target: { value: '' },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && hasValue) {
      e.preventDefault();
      handleClear();
    }
    onKeyDown?.(e);
  };

  return (
    <div
      role="search"
      aria-label={resolvedSearchLabel}
      className={cn('relative flex items-center w-full min-w-0', containerClassName)}
    >
      <Search
        className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none select-none"
        aria-hidden="true"
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder={resolvedPlaceholder}
        aria-label={resolvedSearchLabel}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        className={cn('pl-9 pr-9 w-full bg-background border-border', className)}
        {...props}
      />
      {hasValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleClear}
          aria-label={resolvedClearLabel}
          title={resolvedClearLabel}
          className="absolute right-1.5 size-7 p-0 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </Button>
      )}
    </div>
  );
}

export default SearchInput;

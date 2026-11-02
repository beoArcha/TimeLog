import React, { useRef } from 'react';
import { Paintbrush } from 'lucide-react';
import { translate, TranslationDictionary } from '@common/i18n/translator';
import { Locale } from '@bindings/Locale';
import { PROJECT_COLORS } from '@common/constants/projectColors';
import { isValidHexColor, normalizeHexColor } from '@common/utils/colorUtils';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Switch } from '@components/ui/switch';
import { Label } from '@components/ui/label';
import { Caption } from '@components/ui/typography';
import { HStack, VStack, InlineCluster } from '@components/ui/stack';
import { EmojiPicker } from '@components/EmojiPicker';
import { useAllProjectTags } from '@common/hooks/useAllProjectTags';

function resolvePrefix(prefix?: string): string {
  if (prefix) {
    return `${prefix}-`;
  }
  return '';
}

function resolveTestIdPrefix(idPrefix: string, testIdPrefix?: string): string {
  if (testIdPrefix !== undefined) {
    return resolvePrefix(testIdPrefix);
  }
  return resolvePrefix(idPrefix);
}

function resolveDefaultNameId(idPrefix?: string): string {
  if (idPrefix === 'edit-project') {
    return 'edit-project-name-input';
  }
  if (idPrefix === 'medium') {
    return 'medium-new-project-input';
  }
  return 'new-project-input';
}

function resolveDefaultDescriptionId(idPrefix?: string): string {
  if (idPrefix === 'edit-project') {
    return 'edit-project-desc-input';
  }
  if (idPrefix) {
    return `${idPrefix}-description-input`;
  }
  return 'sidebar-project-description-input';
}

function resolveDefaultTagsId(idPrefix?: string): string {
  if (idPrefix) {
    return `${idPrefix}-tags-input`;
  }
  return 'sidebar-project-tags-input';
}

function resolveDefaultSuggestionsId(idPrefix?: string): string {
  if (idPrefix) {
    return `${idPrefix}-tag-suggestions`;
  }
  return 'sidebar-project-tag-suggestions';
}

function resolveDefaultEmojiTestId(idPrefix?: string): string {
  if (idPrefix) {
    return `${idPrefix}-emoji-picker`;
  }
  return 'sidebar-project-emoji-picker';
}

function resolveDefaultConcurrencyId(idPrefix?: string): string {
  if (idPrefix === 'edit-project') {
    return 'edit-project-concurrency-switch';
  }
  return 'new-project-concurrency';
}

function resolveRatesPrefix(idPrefix?: string): string {
  if (idPrefix) {
    return `${idPrefix}-`;
  }
  return 'sidebar-project-';
}

export interface ProjectColorPaletteProps {
  color: string;
  onChange: (color: string) => void;
  idPrefix?: string;
  testIdPrefix?: string;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
  includeCustomPicker?: boolean;
  selectedRingClass?: string;
  className?: string;
}

export function ProjectColorPalette({
  color,
  onChange,
  idPrefix = '',
  testIdPrefix,
  locale = 'en',
  customTranslations,
  includeCustomPicker = true,
  selectedRingClass = 'ring-2 ring-orange-500 ring-offset-2 scale-105',
  className,
}: ProjectColorPaletteProps) {
  const colorInputRef = useRef<HTMLInputElement>(null);
  const isCustomColor = isValidHexColor(color);
  const prefix = resolvePrefix(idPrefix);
  const effectiveTestIdPrefix = resolveTestIdPrefix(idPrefix, testIdPrefix);

  const handleCustomColorClick = () => {
    if (!isCustomColor) {
      const currentHex = colorInputRef.current?.value || '#8b5cf6';
      onChange(currentHex);
    }
    colorInputRef.current?.click();
  };

  return (
    <InlineCluster gap="xs" align="center" className={className}>
      {PROJECT_COLORS.map(col => {
        const isSelected = color === col.name;
        return (
          <Button
            id={`${prefix}color-picker-${col.name}`}
            data-testid={`${effectiveTestIdPrefix}color-picker-${col.name}`}
            key={col.name}
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => onChange(col.name)}
            aria-label={col.name}
            title={col.name}
            className={`w-5 h-5 rounded-full ${col.bg} transition-all duration-200 transform hover:scale-110 flex items-center justify-center p-0 ${
              isSelected ? selectedRingClass : 'opacity-85'
            }`}
          >
            {isSelected && <span className="w-1.5 h-1.5 bg-card rounded-full" />}
          </Button>
        );
      })}

      {includeCustomPicker && (
        <>
          <Button
            id={`${prefix}color-picker-custom`}
            data-testid={`${effectiveTestIdPrefix}color-picker-custom`}
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={handleCustomColorClick}
            aria-label={translate(locale, 'project', 'CustomColorPicker', customTranslations)}
            title={translate(locale, 'project', 'CustomColorPicker', customTranslations)}
            style={isCustomColor ? { backgroundColor: color } : undefined}
            className={`w-5 h-5 rounded-full border border-border transition-all duration-200 transform hover:scale-110 flex items-center justify-center p-0 ${
              isCustomColor
                ? `${selectedRingClass} text-white`
                : 'opacity-85 bg-muted/60 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Paintbrush className="w-2.5 h-2.5" />
          </Button>
          <Input
            ref={colorInputRef}
            id={`${prefix}custom-color-input`}
            data-testid={`${effectiveTestIdPrefix}custom-color-input`}
            type="color"
            value={isCustomColor ? normalizeHexColor(color) : '#8b5cf6'}
            onChange={e => onChange(e.target.value)}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          />
        </>
      )}
    </InlineCluster>
  );
}

export interface ProjectNameInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  dataTestId?: string;
  idPrefix?: string;
  placeholder?: string;
  ariaLabel?: string;
  label?: string;
  showLabel?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
  autoFocus?: boolean;
  required?: boolean;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export function ProjectNameInput({
  value,
  onChange,
  id,
  dataTestId,
  idPrefix,
  placeholder,
  ariaLabel,
  label,
  showLabel = false,
  onKeyDown,
  className,
  autoFocus,
  required,
  locale = 'en',
  customTranslations,
}: ProjectNameInputProps) {
  const defaultId = id ?? resolveDefaultNameId(idPrefix);
  const effectivePlaceholder =
    placeholder ?? translate(locale, 'project', 'EnterProjectName', customTranslations);
  const effectiveAriaLabel =
    ariaLabel ?? translate(locale, 'project', 'ProjectName', customTranslations);

  return (
    <div className="w-full">
      {showLabel && (
        <Label
          htmlFor={defaultId}
          className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1"
        >
          {label ?? effectiveAriaLabel}
        </Label>
      )}
      <Input
        id={defaultId}
        data-testid={dataTestId ?? defaultId}
        type="text"
        placeholder={effectivePlaceholder}
        aria-label={effectiveAriaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        autoFocus={autoFocus}
        required={required}
        className={className}
      />
    </div>
  );
}

export interface ProjectEmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  testId?: string;
  idPrefix?: string;
  label?: string;
  showLabel?: boolean;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export function ProjectEmojiSelector({
  value,
  onChange,
  testId,
  idPrefix,
  label,
  showLabel = false,
  locale = 'en',
  customTranslations,
}: ProjectEmojiPickerProps) {
  const effectiveTestId = testId ?? resolveDefaultEmojiTestId(idPrefix);

  return (
    <div>
      {showLabel && (
        <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1">
          {label ?? translate(locale, 'project', 'EmojiIcon', customTranslations)}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <EmojiPicker value={value} onChange={onChange} testId={effectiveTestId} />
      </div>
    </div>
  );
}

export interface ProjectDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  dataTestId?: string;
  idPrefix?: string;
  placeholder?: string;
  ariaLabel?: string;
  label?: string;
  showLabel?: boolean;
  className?: string;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export function ProjectDescriptionInput({
  value,
  onChange,
  id,
  dataTestId,
  idPrefix,
  placeholder,
  ariaLabel,
  label,
  showLabel = false,
  className,
  locale = 'en',
  customTranslations,
}: ProjectDescriptionInputProps) {
  const defaultId = id ?? resolveDefaultDescriptionId(idPrefix);
  const effectivePlaceholder =
    placeholder ?? translate(locale, 'project', 'DescriptionPlaceholder', customTranslations);
  const effectiveAriaLabel =
    ariaLabel ?? translate(locale, 'project', 'Description', customTranslations);

  return (
    <div className="w-full">
      {showLabel && (
        <Label
          htmlFor={defaultId}
          className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1"
        >
          {label ?? effectiveAriaLabel}
        </Label>
      )}
      <Textarea
        id={defaultId}
        data-testid={dataTestId ?? defaultId}
        placeholder={effectivePlaceholder}
        aria-label={effectiveAriaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={className}
      />
    </div>
  );
}

export interface ProjectTagSuggestionsProps {
  value: string;
  onChange: (value: string) => void;
  availableTags?: string[];
  testId?: string;
  idPrefix?: string;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
  className?: string;
}

export function ProjectTagSuggestions({
  value,
  onChange,
  availableTags: propTags,
  testId,
  idPrefix,
  locale = 'en',
  customTranslations,
  className,
}: ProjectTagSuggestionsProps) {
  const hookTags = useAllProjectTags();
  const availableTags = propTags ?? hookTags;
  const defaultSuggestionsTestId = testId ?? resolveDefaultSuggestionsId(idPrefix);

  const handleAddTagSuggestion = (tagToAdd: string) => {
    const currentTags = value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);
    if (!currentTags.includes(tagToAdd)) {
      const updated = [...currentTags, tagToAdd].join(', ');
      onChange(updated);
    }
  };

  if (!availableTags || availableTags.length === 0) return null;

  return (
    <VStack gap="2xs" className={className ?? 'w-full'} data-testid={defaultSuggestionsTestId}>
      <Caption size="xs" variant="muted" className="font-mono text-[10px] uppercase tracking-wider block">
        {translate(locale, 'project', 'TagSuggestionsLabel', customTranslations)}
      </Caption>
      <div className="flex flex-wrap gap-1">
        {availableTags.map(tag => (
          <Button
            key={tag}
            type="button"
            variant="outline"
            size="xs"
            onClick={() => handleAddTagSuggestion(tag)}
            data-testid={`tag-suggestion-${tag}`}
            className="h-5 px-2 py-0 text-[10px] rounded-full font-normal cursor-pointer"
          >
            {tag}
          </Button>
        ))}
      </div>
    </VStack>
  );
}

export interface ProjectTagsInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  dataTestId?: string;
  suggestionsTestId?: string;
  idPrefix?: string;
  placeholder?: string;
  ariaLabel?: string;
  label?: string;
  showLabel?: boolean;
  showSuggestions?: boolean;
  availableTags?: string[];
  className?: string;
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export function ProjectTagsInput({
  value,
  onChange,
  id,
  dataTestId,
  suggestionsTestId,
  idPrefix,
  placeholder,
  ariaLabel,
  label,
  showLabel = false,
  showSuggestions = true,
  availableTags,
  className,
  locale = 'en',
  customTranslations,
}: ProjectTagsInputProps) {
  const defaultId = id ?? resolveDefaultTagsId(idPrefix);
  const defaultSuggestionsTestId = suggestionsTestId ?? resolveDefaultSuggestionsId(idPrefix);
  const effectivePlaceholder =
    placeholder ?? translate(locale, 'project', 'TagsPlaceholder', customTranslations);
  const effectiveAriaLabel = ariaLabel ?? translate(locale, 'project', 'Tags', customTranslations);

  return (
    <div className="w-full">
      {showLabel && (
        <Label
          htmlFor={defaultId}
          className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1"
        >
          {label ?? effectiveAriaLabel}
        </Label>
      )}
      <Input
        id={defaultId}
        data-testid={dataTestId ?? defaultId}
        type="text"
        placeholder={effectivePlaceholder}
        aria-label={effectiveAriaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        className={className}
      />

      {showSuggestions && (
        <div className="mt-2">
          <ProjectTagSuggestions
            value={value}
            onChange={onChange}
            availableTags={availableTags}
            testId={defaultSuggestionsTestId}
            locale={locale}
            customTranslations={customTranslations}
          />
        </div>
      )}
    </div>
  );
}

export interface ProjectRatesInputProps {
  hourlyRate: string;
  onHourlyRateChange: (rate: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  idPrefix?: string;
  rateId?: string;
  rateTestId?: string;
  currencyId?: string;
  currencyTestId?: string;
  showLabels?: boolean;
  rateLabel?: string;
  currencyLabel?: string;
  ratePlaceholder?: string;
  currencyPlaceholder?: string;
  rateClassName?: string;
  currencyClassName?: string;
  containerLayout?: 'grid' | 'hstack';
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export function ProjectRatesInput({
  hourlyRate,
  onHourlyRateChange,
  currency,
  onCurrencyChange,
  idPrefix,
  rateId,
  rateTestId,
  currencyId,
  currencyTestId,
  showLabels = false,
  rateLabel,
  currencyLabel,
  ratePlaceholder,
  currencyPlaceholder,
  rateClassName,
  currencyClassName,
  containerLayout = 'hstack',
  locale = 'en',
  customTranslations,
}: ProjectRatesInputProps) {
  const prefix = resolveRatesPrefix(idPrefix);
  const defaultRateId = rateId ?? `${prefix}hourly-rate`;
  const defaultCurrencyId = currencyId ?? `${prefix}currency`;
  const defaultRateTestId = rateTestId ?? defaultRateId;
  const defaultCurrencyTestId = currencyTestId ?? defaultCurrencyId;

  const effRatePlaceholder =
    ratePlaceholder ?? translate(locale, 'project', 'HourlyRatePlaceholder', customTranslations);
  const effRateLabel =
    rateLabel ?? translate(locale, 'project', 'HourlyRate', customTranslations);
  const effCurrencyPlaceholder =
    currencyPlaceholder ?? translate(locale, 'project', 'CurrencyPlaceholder', customTranslations);
  const effCurrencyLabel =
    currencyLabel ?? translate(locale, 'project', 'Currency', customTranslations);

  if (containerLayout === 'grid') {
    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          {showLabels && (
            <Label
              htmlFor={defaultRateId}
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1"
            >
              {effRateLabel}
            </Label>
          )}
          <Input
            id={defaultRateId}
            data-testid={defaultRateTestId}
            type="text"
            placeholder={effRatePlaceholder}
            aria-label={effRateLabel}
            value={hourlyRate}
            onChange={e => onHourlyRateChange(e.target.value)}
            className={rateClassName ?? 'w-full'}
          />
        </div>
        <div>
          {showLabels && (
            <Label
              htmlFor={defaultCurrencyId}
              className="text-xs font-mono uppercase tracking-wider text-muted-foreground block mb-1"
            >
              {effCurrencyLabel}
            </Label>
          )}
          <Input
            id={defaultCurrencyId}
            data-testid={defaultCurrencyTestId}
            type="text"
            placeholder={effCurrencyPlaceholder}
            aria-label={effCurrencyLabel}
            value={currency}
            onChange={e => onCurrencyChange(e.target.value.toUpperCase())}
            maxLength={4}
            className={currencyClassName ?? 'w-full'}
          />
        </div>
      </div>
    );
  }

  return (
    <HStack gap="xs" className="w-full">
      <Input
        id={defaultRateId}
        data-testid={defaultRateTestId}
        type="text"
        placeholder={effRatePlaceholder}
        aria-label={effRateLabel}
        value={hourlyRate}
        onChange={e => onHourlyRateChange(e.target.value)}
        className={rateClassName ?? 'flex-1 px-2 py-1 text-xs'}
      />
      <Input
        id={defaultCurrencyId}
        data-testid={defaultCurrencyTestId}
        type="text"
        placeholder={effCurrencyPlaceholder}
        aria-label={effCurrencyLabel}
        value={currency}
        onChange={e => onCurrencyChange(e.target.value.toUpperCase())}
        maxLength={4}
        className={currencyClassName ?? 'w-20 px-2 py-1 text-xs uppercase'}
      />
    </HStack>
  );
}

export interface ProjectConcurrencySwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  dataTestId?: string;
  idPrefix?: string;
  label?: string;
  description?: string;
  variant?: 'compact' | 'boxed';
  locale?: Locale;
  customTranslations?: Partial<TranslationDictionary>;
}

export function ProjectConcurrencySwitch({
  checked,
  onCheckedChange,
  id,
  dataTestId,
  idPrefix,
  label,
  description,
  variant = 'compact',
  locale = 'en',
  customTranslations,
}: ProjectConcurrencySwitchProps) {
  const defaultId = id ?? resolveDefaultConcurrencyId(idPrefix);
  const defaultTestId = dataTestId ?? defaultId;
  const effectiveLabel = label ?? translate(locale, 'project', 'AllowConcurrency', customTranslations);
  const effectiveDescription =
    description ?? translate(locale, 'project', 'AllowConcurrencyDesc', customTranslations);

  if (variant === 'boxed') {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor={defaultId} className="text-sm font-medium cursor-pointer">
            {effectiveLabel}
          </Label>
          <span className="text-xs text-muted-foreground">{effectiveDescription}</span>
        </div>
        <Switch id={defaultId} data-testid={defaultTestId} checked={checked} onCheckedChange={onCheckedChange} />
      </div>
    );
  }

  return (
    <HStack justify="between" align="center" className="w-full pt-1">
      <VStack gap="none">
        <Label htmlFor={defaultId} className="text-xs font-medium cursor-pointer">
          {effectiveLabel}
        </Label>
        <Caption size="xs" variant="muted">
          {effectiveDescription}
        </Caption>
      </VStack>
      <Switch id={defaultId} data-testid={defaultTestId} checked={checked} onCheckedChange={onCheckedChange} />
    </HStack>
  );
}

export interface ProjectFormFieldsProps {
  children?: React.ReactNode;
}

export function ProjectFormFields({ children }: ProjectFormFieldsProps) {
  return <>{children}</>;
}

ProjectFormFields.ColorPalette = ProjectColorPalette;
ProjectFormFields.Emoji = ProjectEmojiSelector;
ProjectFormFields.Name = ProjectNameInput;
ProjectFormFields.Description = ProjectDescriptionInput;
ProjectFormFields.Tags = ProjectTagsInput;
ProjectFormFields.TagSuggestions = ProjectTagSuggestions;
ProjectFormFields.Rates = ProjectRatesInput;
ProjectFormFields.Concurrency = ProjectConcurrencySwitch;

export default ProjectFormFields;

import React, { useState } from 'react';
import { Languages, Check, Globe } from 'lucide-react';
import { useLocale } from '@common/hooks/LocaleProvider';
import type { Locale } from '@bindings/Locale';
import { STANDARD_LOCALES, LOCALE_METADATA, resolveSystemLocale } from '@common/i18n/locales';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@components/ui/radio-group';
import { Label } from '@components/ui/label';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { HStack, VStack } from '@components/ui/stack';
import { Caption, MonoText } from '@components/ui/typography';
import { translate } from '@common/i18n/translator';
import { cn } from '@/lib/utils';

export interface LanguageRadioItemProps {
  key?: React.Key;
  id: string;
  value: Locale;
  checked: boolean;
  onSelect: (value: Locale) => void;
  testId?: string;
  ariaLabel?: string;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export function LanguageRadioItem({
  id,
  value,
  checked,
  onSelect,
  testId,
  ariaLabel,
  title,
  subtitle,
  badge,
  icon,
  className,
}: LanguageRadioItemProps) {
  return (
    <div
      onClick={() => onSelect(value)}
      className={cn(
        'p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between select-none outline-none focus-within:ring-2 focus-within:ring-primary/40',
        checked
          ? 'border-primary bg-primary/10 shadow-xs'
          : 'border-border bg-muted/20 hover:bg-muted/40',
        className
      )}
    >
      <HStack align="center" gap="md" className="min-w-0">
        <RadioGroupItem
          value={value}
          id={id}
          data-testid={testId}
          aria-label={ariaLabel || title}
        />
        <VStack gap="none" className="min-w-0">
          <HStack align="center" gap="xs">
            {icon}
            <Label
              htmlFor={id}
              className="font-bold text-sm text-foreground truncate cursor-pointer select-none font-normal"
            >
              {title}
            </Label>
          </HStack>
          {subtitle && (
            <Caption variant="muted" size="xs" className="truncate">
              {subtitle}
            </Caption>
          )}
        </VStack>
      </HStack>
      {badge}
    </div>
  );
}

export interface LanguageSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LanguageSelectionModal({ open, onOpenChange }: LanguageSelectionModalProps) {
  const { localePref, setLocalePref, locale, customTranslations } = useLocale();
  const [pendingSelection, setPendingSelection] = useState<Locale | null>(null);

  const activeSelection = pendingSelection ?? localePref;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setPendingSelection(null);
    }
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    if (pendingSelection !== null) {
      setLocalePref(pendingSelection);
    }
    setPendingSelection(null);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setPendingSelection(null);
    onOpenChange(false);
  };

  // Resolved operating system language metadata (independent of active localePref)
  const systemResolvedLocale = resolveSystemLocale();
  const systemResolvedInfo = LOCALE_METADATA[systemResolvedLocale] || {
    nativeName: systemResolvedLocale.toUpperCase(),
    englishName: systemResolvedLocale.toUpperCase(),
  };

  const hasCustomOverrides = Object.keys(customTranslations || {}).length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="language-selection-modal"
        role="dialog"
        aria-label={translate(locale, 'settings', 'LanguageSelectionAria', customTranslations)}
        className="max-w-xl p-6 bg-card border-border text-card-foreground shadow-2xl"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Languages className="w-5 h-5 text-primary" aria-hidden="true" />
            <span>{translate(locale, 'settings', 'Title', customTranslations)}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {translate(locale, 'settings', 'Description', customTranslations)}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <RadioGroup
            value={activeSelection}
            onValueChange={(val) => setPendingSelection(val as Locale)}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1"
            aria-label={translate(locale, 'settings', 'LanguageSelectionAria', customTranslations)}
          >
            {/* System Default Option */}
            <LanguageRadioItem
              id="modal-lang-system"
              value="system"
              checked={activeSelection === 'system'}
              onSelect={setPendingSelection}
              testId="modal-lang-system"
              ariaLabel={translate(locale, 'settings', 'SystemLanguageAria', customTranslations)}
              icon={<Globe className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />}
              title={translate(locale, 'settings', 'SystemDefault', customTranslations)}
              subtitle={translate(locale, 'settings', 'SystemLanguageDesc', customTranslations)}
              badge={
                <Badge variant="outline" className="text-2xs font-mono shrink-0 ml-2">
                  {translate(locale, 'settings', 'ResolvedSystemLocale', customTranslations, {
                    name: systemResolvedInfo.nativeName,
                    code: systemResolvedLocale,
                  })}
                </Badge>
              }
              className="col-span-1 sm:col-span-2"
            />

            {/* Standard 10 Locales */}
            {STANDARD_LOCALES.map((code) => {
              const meta = LOCALE_METADATA[code];
              const isSelected = activeSelection === code;
              return (
                <LanguageRadioItem
                  key={code}
                  id={`modal-lang-${code}`}
                  value={code}
                  checked={isSelected}
                  onSelect={setPendingSelection}
                  testId={`modal-lang-${code}`}
                  ariaLabel={`${meta.nativeName} (${meta.englishName})`}
                  title={meta.nativeName}
                  subtitle={meta.englishName}
                  badge={
                    <MonoText size="xs" variant="muted" className="shrink-0 uppercase font-bold ml-2">
                      {code}
                    </MonoText>
                  }
                />
              );
            })}

            {/* Custom Locale Option (when configured or selected) */}
            {(hasCustomOverrides || activeSelection === 'custom') && (
              <LanguageRadioItem
                id="modal-lang-custom"
                value="custom"
                checked={activeSelection === 'custom'}
                onSelect={setPendingSelection}
                testId="modal-lang-custom"
                ariaLabel={translate(locale, 'settings', 'CustomLanguageTitle', customTranslations)}
                title={translate(locale, 'settings', 'CustomLanguageTitle', customTranslations)}
                subtitle={translate(locale, 'settings', 'CustomLanguageDesc', customTranslations)}
                badge={
                  <Badge variant="secondary" className="text-2xs font-mono shrink-0 ml-2">
                    CUSTOM
                  </Badge>
                }
                className="col-span-1 sm:col-span-2"
              />
            )}
          </RadioGroup>
        </div>

        <DialogFooter className="mt-4 flex flex-row items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            data-testid="modal-cancel-btn"
          >
            <span>{translate(locale, 'common', 'Cancel', customTranslations)}</span>
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={handleConfirm}
            data-testid="modal-confirm-btn"
            icon={Check}
          >
            <span>{translate(locale, 'common', 'Save', customTranslations)}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LanguageSelectionModal;

import React, { useState } from 'react';
import { Languages, Check, Globe } from 'lucide-react';
import { useLocale } from '@common/hooks/LocaleProvider';
import type { Locale } from '@bindings/Locale';
import { STANDARD_LOCALES, LOCALE_METADATA } from '@common/i18n/locales';
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

  // Resolved system language metadata
  const resolvedLocaleInfo = LOCALE_METADATA[locale] || {
    nativeName: locale.toUpperCase(),
    englishName: locale.toUpperCase(),
  };

  const hasCustomOverrides = Object.keys(customTranslations || {}).length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-testid="language-selection-modal"
        role="dialog"
        aria-label="Language selection"
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
            aria-label="Available languages"
          >
            {/* System Default Option */}
            <div
              onClick={() => setPendingSelection('system')}
              className={cn(
                'col-span-1 sm:col-span-2 p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between',
                activeSelection === 'system'
                  ? 'border-primary bg-primary/10 shadow-xs'
                  : 'border-border bg-muted/20 hover:bg-muted/40'
              )}
            >
              <HStack align="center" gap="md" className="min-w-0">
                <RadioGroupItem
                  value="system"
                  id="modal-lang-system"
                  data-testid="modal-lang-system"
                  aria-label="System default language"
                />
                <VStack gap="none" className="min-w-0">
                  <HStack align="center" gap="xs">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <Label
                      htmlFor="modal-lang-system"
                      className="font-bold text-sm cursor-pointer select-none text-foreground"
                    >
                      System default
                    </Label>
                  </HStack>
                  <Caption variant="muted" size="xs">
                    Match operating system locale
                  </Caption>
                </VStack>
              </HStack>
              <Badge variant="outline" className="text-2xs font-mono shrink-0 ml-2">
                Resolved: {resolvedLocaleInfo.nativeName} ({locale})
              </Badge>
            </div>

            {/* Standard 10 Locales */}
            {STANDARD_LOCALES.map((code) => {
              const meta = LOCALE_METADATA[code];
              const isSelected = activeSelection === code;
              return (
                <div
                  key={code}
                  onClick={() => setPendingSelection(code)}
                  className={cn(
                    'p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : 'border-border bg-muted/20 hover:bg-muted/40'
                  )}
                >
                  <HStack align="center" gap="md" className="min-w-0">
                    <RadioGroupItem
                      value={code}
                      id={`modal-lang-${code}`}
                      data-testid={`modal-lang-${code}`}
                      aria-label={`${meta.nativeName} (${meta.englishName})`}
                    />
                    <VStack gap="none" className="min-w-0">
                      <Label
                        htmlFor={`modal-lang-${code}`}
                        className="font-bold text-sm cursor-pointer select-none text-foreground truncate"
                      >
                        {meta.nativeName}
                      </Label>
                      <Caption variant="muted" size="xs" className="truncate">
                        {meta.englishName}
                      </Caption>
                    </VStack>
                  </HStack>
                  <MonoText size="xs" variant="muted" className="shrink-0 uppercase font-bold ml-2">
                    {code}
                  </MonoText>
                </div>
              );
            })}

            {/* Custom Locale Option (when configured or selected) */}
            {(hasCustomOverrides || activeSelection === 'custom') && (
              <div
                onClick={() => setPendingSelection('custom')}
                className={cn(
                  'col-span-1 sm:col-span-2 p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between',
                  activeSelection === 'custom'
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-muted/20 hover:bg-muted/40'
                )}
              >
                <HStack align="center" gap="md" className="min-w-0">
                  <RadioGroupItem
                    value="custom"
                    id="modal-lang-custom"
                    data-testid="modal-lang-custom"
                    aria-label="Custom translation overrides"
                  />
                  <VStack gap="none" className="min-w-0">
                    <Label
                      htmlFor="modal-lang-custom"
                      className="font-bold text-sm cursor-pointer select-none text-foreground"
                    >
                      {translate(locale, 'settings', 'CustomLanguageTitle', customTranslations)}
                    </Label>
                    <Caption variant="muted" size="xs">
                      User-configured string overrides
                    </Caption>
                  </VStack>
                </HStack>
                <Badge variant="secondary" className="text-2xs font-mono shrink-0 ml-2">
                  CUSTOM
                </Badge>
              </div>
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
            className="gap-1.5"
          >
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>{translate(locale, 'common', 'Save', customTranslations)}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LanguageSelectionModal;

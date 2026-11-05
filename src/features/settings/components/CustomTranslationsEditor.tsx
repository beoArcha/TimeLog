import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useLocale } from '@common/hooks/LocaleProvider';
import { I18N_DOMAINS, type I18nDomain } from '@common/i18n/keys';
import { translate } from '@common/i18n/translator';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Form } from '@components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { HStack, VStack } from '@components/ui/stack';
import { Text, Caption, MonoText } from '@components/ui/typography';

export function CustomTranslationsEditor() {
  const { locale, customTranslations, setCustomTranslations } = useLocale();

  const [overrideDomain, setOverrideDomain] = useState<string>('common');
  const [overrideKey, setOverrideKey] = useState('');
  const [overrideValue, setOverrideValue] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();

    if (!overrideKey.trim()) {
      const errorMsg = translate(locale, 'settings', 'ValidationKeyRequired', customTranslations);
      setValidationError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!overrideValue.trim()) {
      const errorMsg = translate(locale, 'settings', 'ValidationValueRequired', customTranslations);
      setValidationError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setValidationError(null);

    setCustomTranslations((prev) => {
      const next = { ...(prev || {}) };
      const domainObj = { ...((next[overrideDomain] as Record<string, string>) || {}) };
      domainObj[overrideKey.trim()] = overrideValue.trim();
      next[overrideDomain] = domainObj;
      return next;
    });

    setOverrideKey('');
    setOverrideValue('');
  };

  const handleRemoveOverride = (domain: string, key: string) => {
    setCustomTranslations((prev) => {
      const next = { ...(prev || {}) };
      const domainObj = { ...((next[domain] as Record<string, string>) || {}) };
      delete domainObj[key];
      if (Object.keys(domainObj).length === 0) {
        delete next[domain];
      } else {
        next[domain] = domainObj;
      }
      return next;
    });
  };

  const overrideEntries: Array<{ domain: string; key: string; value: string }> = [];
  if (customTranslations) {
    for (const [domain, keys] of Object.entries(customTranslations)) {
      if (keys && typeof keys === 'object') {
        for (const [k, v] of Object.entries(keys as Record<string, string>)) {
          overrideEntries.push({ domain, key: k, value: String(v) });
        }
      }
    }
  }

  return (
    <VStack gap="sm" className="pt-2 border-t border-border">
      <HStack justify="between" align="center">
        <VStack gap="none">
          <Text size="sm" weight="bold">
            {translate(locale, 'settings', 'CustomLanguageTitle', customTranslations)}
          </Text>
          <Caption variant="muted" size="xs">
            {translate(locale, 'settings', 'CustomTranslationsDesc', customTranslations)}
          </Caption>
        </VStack>
        {overrideEntries.length > 0 && (
          <Badge variant="secondary" className="font-mono text-2xs">
            {translate(locale, 'settings', 'CustomOverridesCount', customTranslations, {
              count: overrideEntries.length,
            })}
          </Badge>
        )}
      </HStack>

      {/* Overrides List */}
      {overrideEntries.length > 0 && (
        <div
          data-testid="custom-overrides-list"
          className="flex flex-col gap-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-muted/20 border border-border"
        >
          {overrideEntries.map((entry) => (
            <HStack
              key={`${entry.domain}.${entry.key}`}
              justify="between"
              align="center"
              className="p-2 rounded-lg bg-card border border-border/60 text-xs"
            >
              <HStack align="center" gap="xs" className="min-w-0">
                <MonoText size="xs" weight="bold" className="text-primary">
                  {entry.domain}.{entry.key}
                </MonoText>
                <span className="text-muted-foreground">=</span>
                <Text size="xs" className="truncate text-foreground">
                  "{entry.value}"
                </Text>
              </HStack>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveOverride(entry.domain, entry.key)}
                data-testid={`remove-override-${entry.domain}-${entry.key}`}
                aria-label={translate(locale, 'settings', 'RemoveOverrideAria', customTranslations, { name: `${entry.domain}.${entry.key}` })}
                className="size-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
              </Button>
            </HStack>
          ))}
        </div>
      )}

      {/* Add Override Form using Design System Form */}
      <Form
        layout="vertical"
        gap="sm"
        onSubmit={handleSaveOverride}
        className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1"
      >
        <div>
          <Label htmlFor="override-domain-select" className="text-2xs text-muted-foreground block mb-1">
            {translate(locale, 'settings', 'DomainLabel', customTranslations)}
          </Label>
          <Select
            value={overrideDomain}
            onValueChange={(val) => {
              if (val) {
                setOverrideDomain(val);
                setValidationError(null);
              }
            }}
          >
            <SelectTrigger
              id="override-domain-select"
              data-testid="override-domain-select"
              size="sm"
              className="h-8 w-full"
            >
              <SelectValue>{overrideDomain}</SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto">
              {I18N_DOMAINS.map((dom: I18nDomain) => (
                <SelectItem
                  key={dom}
                  value={dom}
                  data-testid={`override-domain-option-${dom}`}
                >
                  {dom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="override-key-input" className="text-2xs text-muted-foreground block mb-1">
            {translate(locale, 'settings', 'CustomLanguageKey', customTranslations)}
          </Label>
          <Input
            id="override-key-input"
            data-testid="override-key-input"
            value={overrideKey}
            onChange={(e) => {
              setOverrideKey(e.target.value);
              if (validationError) setValidationError(null);
            }}
            placeholder={translate(locale, 'settings', 'KeyPlaceholder', customTranslations)}
            size="sm"
          />
        </div>

        <div className="sm:col-span-2">
          <Label htmlFor="override-value-input" className="text-2xs text-muted-foreground block mb-1">
            {translate(locale, 'settings', 'ValueLabel', customTranslations)}
          </Label>
          <HStack gap="xs">
            <Input
              id="override-value-input"
              data-testid="override-value-input"
              value={overrideValue}
              onChange={(e) => {
                setOverrideValue(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder={translate(locale, 'settings', 'ValuePlaceholder', customTranslations)}
              size="sm"
              className="flex-1"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              data-testid="save-custom-override-btn"
              icon={Plus}
              className="shrink-0 h-8"
            >
              <span>{translate(locale, 'settings', 'SaveCustomTranslation', customTranslations)}</span>
            </Button>
          </HStack>
        </div>
      </Form>

      {validationError && (
        <Label
          data-testid="custom-override-validation-error"
          role="alert"
          className="text-xs text-destructive font-medium flex items-center gap-1 mt-1"
        >
          <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{validationError}</span>
        </Label>
      )}
    </VStack>
  );
}

export default CustomTranslationsEditor;

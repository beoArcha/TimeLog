import React, { useState } from 'react';
import { Languages, Globe, Plus, Trash2, SlidersHorizontal } from 'lucide-react';
import CollapsibleCard from '@components/CollapsibleCard';
import { useLocale } from '@common/hooks/LocaleProvider';
import { STANDARD_LOCALES, LOCALE_METADATA } from '@common/i18n/locales';
import { translate } from '@common/i18n/translator';
import { LanguageSelectionModal } from './LanguageSelectionModal';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Form } from '@components/ui/form';
import { HStack, VStack } from '@components/ui/stack';
import { Grid } from '@components/ui/grid';
import { Text, Caption, MonoText } from '@components/ui/typography';

export function LanguageSettingsCard() {
  const {
    localePref,
    setLocalePref,
    locale,
    customTranslations,
    setCustomTranslations,
  } = useLocale();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [overrideDomain, setOverrideDomain] = useState('common');
  const [overrideKey, setOverrideKey] = useState('');
  const [overrideValue, setOverrideValue] = useState('');

  const currentMeta = LOCALE_METADATA[localePref] || {
    nativeName: localePref,
    englishName: localePref,
  };
  const resolvedMeta = LOCALE_METADATA[locale] || {
    nativeName: locale,
    englishName: locale,
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideDomain.trim() || !overrideKey.trim() || !overrideValue.trim()) return;

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
    <>
      <CollapsibleCard
        title={translate(locale, 'settings', 'Title', customTranslations)}
        icon={Languages}
        iconColor="text-indigo-500"
        titleColor="text-foreground"
        defaultExpanded={true}
        headerTestId="language-settings-card-header"
        wrapperClassName="p-6 rounded-3xl border border-border bg-card flex flex-col gap-4 text-card-foreground shadow-xs"
      >
        <VStack gap="lg" className="mt-2">
          {/* Active Status & Modal Launcher */}
          <div className="p-4 rounded-2xl border border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <VStack gap="xs" className="min-w-0">
              <HStack align="center" gap="sm">
                <Globe className="w-5 h-5 text-indigo-500 shrink-0" aria-hidden="true" />
                <Text size="base" weight="bold" className="text-foreground truncate">
                  {localePref === 'system'
                    ? 'System default'
                    : `${currentMeta.nativeName} (${currentMeta.englishName})`}
                </Text>
                <Badge variant={localePref === 'system' ? 'outline' : 'default'} className="font-mono text-2xs uppercase">
                  {localePref}
                </Badge>
              </HStack>

              {localePref === 'system' ? (
                <Caption variant="muted" size="xs">
                  Active system resolution:{' '}
                  <span className="font-semibold text-foreground">
                    {resolvedMeta.nativeName} ({locale})
                  </span>
                </Caption>
              ) : (
                <Caption variant="muted" size="xs">
                  Language explicitly locked to user preference.
                </Caption>
              )}
            </VStack>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              data-testid="open-language-modal-btn"
              className="gap-2 shrink-0 self-start sm:self-auto"
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              <span>{translate(locale, 'settings', 'AddLanguage', customTranslations)}</span>
            </Button>
          </div>

          {/* Quick Language Selector Grid */}
          <VStack gap="xs">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Quick Language Selection
            </Label>
            <Grid cols={2} gap="sm" className="sm:grid-cols-4 md:grid-cols-6">
              {/* System button */}
              <Button
                type="button"
                variant={localePref === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLocalePref('system')}
                data-testid="quick-lang-system"
                className="justify-between px-3 h-9"
              >
                <span className="truncate">System</span>
                <MonoText size="2xs" variant="muted" className="ml-1 uppercase">
                  SYS
                </MonoText>
              </Button>

              {/* 10 Standard Locales */}
              {STANDARD_LOCALES.map((code) => {
                const isSelected = localePref === code;
                const meta = LOCALE_METADATA[code];
                return (
                  <Button
                    key={code}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLocalePref(code)}
                    data-testid={`quick-lang-${code}`}
                    title={`${meta.nativeName} (${meta.englishName})`}
                    className="justify-between px-3 h-9"
                  >
                    <span className="truncate">{meta.nativeName}</span>
                    <MonoText size="2xs" variant="muted" className="ml-1 uppercase">
                      {code}
                    </MonoText>
                  </Button>
                );
              })}
            </Grid>
          </VStack>

          {/* Custom Translation Overrides Section */}
          <VStack gap="sm" className="pt-2 border-t border-border">
            <HStack justify="between" align="center">
              <VStack gap="none">
                <Text size="sm" weight="bold">
                  {translate(locale, 'settings', 'CustomLanguageTitle', customTranslations)}
                </Text>
                <Caption variant="muted" size="xs">
                  Override specific system translation keys without modifying dictionaries.
                </Caption>
              </VStack>
              {overrideEntries.length > 0 && (
                <Badge variant="secondary" className="font-mono text-2xs">
                  {overrideEntries.length} override{overrideEntries.length > 1 ? 's' : ''}
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
                      aria-label={`Remove override ${entry.domain}.${entry.key}`}
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
                <Label htmlFor="override-domain-input" className="text-2xs text-muted-foreground block mb-1">
                  Domain
                </Label>
                <Input
                  id="override-domain-input"
                  data-testid="override-domain-input"
                  value={overrideDomain}
                  onChange={(e) => setOverrideDomain(e.target.value)}
                  placeholder="e.g. common"
                  size="sm"
                />
              </div>
              <div>
                <Label htmlFor="override-key-input" className="text-2xs text-muted-foreground block mb-1">
                  {translate(locale, 'settings', 'CustomLanguageKey', customTranslations)}
                </Label>
                <Input
                  id="override-key-input"
                  data-testid="override-key-input"
                  value={overrideKey}
                  onChange={(e) => setOverrideKey(e.target.value)}
                  placeholder="e.g. Save"
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
                    onChange={(e) => setOverrideValue(e.target.value)}
                    placeholder="Custom translated text"
                    size="sm"
                    className="flex-1"
                  />
                  <Button
                    type="submit"
                    variant="outline"
                    size="sm"
                    data-testid="save-custom-override-btn"
                    className="gap-1 shrink-0 h-8"
                  >
                    <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{translate(locale, 'settings', 'SaveCustomTranslation', customTranslations)}</span>
                  </Button>
                </HStack>
              </div>
            </Form>
          </VStack>
        </VStack>
      </CollapsibleCard>

      <LanguageSelectionModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

export default LanguageSettingsCard;

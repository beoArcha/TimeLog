import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import CollapsibleCard from '@components/CollapsibleCard';
import ConfirmDialog from '@components/ConfirmDialog';
import { Button } from '@components/ui/button';
import { Caption, Text } from '@components/ui/typography';
import { Checkbox } from '@components/ui/checkbox';
import { Label } from '@components/ui/label';
import { VStack } from '@components/ui/stack';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';
import { StorageDomain } from '@common/constants/storage-keys';

const ALL_DOMAINS: readonly StorageDomain[] = ['BUSINESS', 'SETTINGS', 'SYSTEM'] as const;

export function DestructiveResetCard() {
  const { customTranslations, locale } = useLocale();
  const { handleResetLocalStorage } = useData();
  const { supportsTray } = usePlatformCapabilities();
  const isDesktop = supportsTray;

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<StorageDomain[]>([...ALL_DOMAINS]);

  const allSelected = ALL_DOMAINS.every((d) => selectedDomains.includes(d));

  const toggleDomain = (domain: StorageDomain) => {
    setSelectedDomains((prev) =>
      prev.includes(domain) ? prev.filter((d) => d !== domain) : [...prev, domain]
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    setSelectedDomains(checked ? [...ALL_DOMAINS] : []);
  };

  const handleOpenDialog = () => {
    setSelectedDomains([...ALL_DOMAINS]);
    setIsResetModalOpen(true);
  };

  const handleConfirmReset = async () => {
    setIsResetModalOpen(false);
    try {
      if (isDesktop) {
        await handleResetLocalStorage();
      } else {
        await handleResetLocalStorage(selectedDomains);
      }
      toast.success(translate(locale, 'engine', 'ResetSuccess', customTranslations));
    } catch {
      toast.error(translate(locale, 'engine', 'ResetCancel', customTranslations));
    }
  };

  const dialogTitle = isDesktop
    ? translate(locale, 'engine', 'DesktopResetTitle', customTranslations)
    : translate(locale, 'engine', 'PwaResetTitle', customTranslations);

  const dialogDescription = isDesktop
    ? translate(locale, 'engine', 'DesktopResetConfirm', customTranslations)
    : translate(locale, 'engine', 'PwaResetConfirm', customTranslations);

  const resetDesc = isDesktop
    ? translate(locale, 'engine', 'DesktopResetDesc', customTranslations)
    : translate(locale, 'engine', 'PwaResetDesc', customTranslations);

  const resetBtnLabel = isDesktop
    ? translate(locale, 'engine', 'DesktopResetBtn', customTranslations)
    : translate(locale, 'engine', 'PwaResetBtn', customTranslations);

  return (
    <>
      <ConfirmDialog
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
        title={dialogTitle}
        description={dialogDescription}
        variant="destructive"
        confirmLabel={resetBtnLabel}
        cancelLabel={translate(locale, 'common', 'Cancel', customTranslations)}
        onConfirm={handleConfirmReset}
        onCancel={() => setIsResetModalOpen(false)}
        confirmDisabled={!isDesktop && selectedDomains.length === 0}
      >
        {!isDesktop && (
          <VStack gap="sm" className="mt-2 p-3 bg-muted/40 rounded-xl border border-border/40">
            <Label
              htmlFor="reset-scope-all"
              className="flex items-center gap-2 cursor-pointer pb-2 border-b border-border/40 select-none font-normal"
            >
              <Checkbox
                id="reset-scope-all"
                data-testid="reset-scope-all"
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
              />
              <VStack gap="none" className="text-left">
                <Text size="sm" className="font-semibold">
                  {translate(locale, 'engine', 'ResetDomainAll', customTranslations)}
                </Text>
                <Caption size="2xs" variant="muted">
                  {translate(locale, 'engine', 'ResetDomainAllDesc', customTranslations)}
                </Caption>
              </VStack>
            </Label>

            <VStack gap="xs" className="pl-1">
              <Label htmlFor="reset-scope-business" className="flex items-center gap-2 cursor-pointer select-none font-normal">
                <Checkbox
                  id="reset-scope-business"
                  data-testid="reset-scope-business"
                  checked={selectedDomains.includes('BUSINESS')}
                  onCheckedChange={() => toggleDomain('BUSINESS')}
                />
                <VStack gap="none" className="text-left">
                  <Text size="xs" className="font-medium">
                    {translate(locale, 'engine', 'ResetDomainBusiness', customTranslations)}
                  </Text>
                  <Caption size="2xs" variant="muted">
                    {translate(locale, 'engine', 'ResetDomainBusinessDesc', customTranslations)}
                  </Caption>
                </VStack>
              </Label>

              <Label htmlFor="reset-scope-settings" className="flex items-center gap-2 cursor-pointer select-none font-normal">
                <Checkbox
                  id="reset-scope-settings"
                  data-testid="reset-scope-settings"
                  checked={selectedDomains.includes('SETTINGS')}
                  onCheckedChange={() => toggleDomain('SETTINGS')}
                />
                <VStack gap="none" className="text-left">
                  <Text size="xs" className="font-medium">
                    {translate(locale, 'engine', 'ResetDomainSettings', customTranslations)}
                  </Text>
                  <Caption size="2xs" variant="muted">
                    {translate(locale, 'engine', 'ResetDomainSettingsDesc', customTranslations)}
                  </Caption>
                </VStack>
              </Label>

              <Label htmlFor="reset-scope-system" className="flex items-center gap-2 cursor-pointer select-none font-normal">
                <Checkbox
                  id="reset-scope-system"
                  data-testid="reset-scope-system"
                  checked={selectedDomains.includes('SYSTEM')}
                  onCheckedChange={() => toggleDomain('SYSTEM')}
                />
                <VStack gap="none" className="text-left">
                  <Text size="xs" className="font-medium">
                    {translate(locale, 'engine', 'ResetDomainSystem', customTranslations)}
                  </Text>
                  <Caption size="2xs" variant="muted">
                    {translate(locale, 'engine', 'ResetDomainSystemDesc', customTranslations)}
                  </Caption>
                </VStack>
              </Label>
            </VStack>
          </VStack>
        )}
      </ConfirmDialog>

      <CollapsibleCard
        title={translate(locale, 'engine', 'DestructiveZone', customTranslations)}
        icon={AlertTriangle}
        iconColor="text-rose-500"
        titleColor="text-rose-500"
        defaultExpanded={false}
        headerTestId="destructive-zone-card"
        wrapperClassName="p-6 rounded-3xl border border-rose-500/30 bg-rose-500/5 flex flex-col gap-4"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
          <Caption variant="muted" className="max-w-sm">
            {resetDesc}
          </Caption>
          <Button
            data-testid="hard-reset-btn"
            variant="destructive"
            onClick={handleOpenDialog}
            className="bg-rose-500 hover:bg-rose-600 px-6 py-3 rounded-2xl text-white text-xs font-bold uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap h-auto"
          >
            <RefreshCw className="w-4 h-4" /> {resetBtnLabel}
          </Button>
        </div>
      </CollapsibleCard>
    </>
  );
}

export default DestructiveResetCard;

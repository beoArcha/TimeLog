import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import CollapsibleCard from '@components/CollapsibleCard';
import ConfirmDialog from '@components/ConfirmDialog';
import { Button } from '@components/ui/button';
import { Caption } from '@components/ui/typography';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { usePlatformCapabilities } from '@common/contexts/PlatformCapabilitiesContext';

export function DestructiveResetCard() {
  const { customTranslations, locale } = useLocale();
  const { handleResetLocalStorage } = useData();
  const { supportsTray } = usePlatformCapabilities();
  const isDesktop = supportsTray;

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleConfirmReset = async () => {
    setIsResetModalOpen(false);
    try {
      await handleResetLocalStorage();
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
      />

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
            onClick={() => setIsResetModalOpen(true)}
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

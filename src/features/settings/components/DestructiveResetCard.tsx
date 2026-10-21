import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import CollapsibleCard from '@components/CollapsibleCard';
import PromptDialog from '@components/PromptDialog';
import { Button } from '@components/ui/button';
import { Caption } from '@components/ui/typography';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useData } from '@common/hooks/DataContext';
import { ErrorHandler, PersistenceException } from '@common/exceptions';

export function DestructiveResetCard() {
  const { customTranslations, locale } = useLocale();
  const { setProjects, setTasks, setLogs } = useData();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleConfirmReset = (response: string) => {
    setIsResetModalOpen(false);
    if (response === 'reset') {
      setProjects([]);
      setTasks([]);
      setLogs([]);
      try {
        localStorage.removeItem('oxytime_state_db_6');
      } catch (err) {
        ErrorHandler.handle(
          new PersistenceException(
            'Failed to remove state DB from localStorage during reset',
            err,
            'ERR_SETTINGS_RESET'
          )
        );
      }
      toast.success(translate(locale, 'engine', 'ResetSuccess', customTranslations));
    } else {
      toast.error(translate(locale, 'engine', 'ResetCancel', customTranslations));
    }
  };

  return (
    <>
      <PromptDialog
        open={isResetModalOpen}
        onOpenChange={setIsResetModalOpen}
        title={translate(locale, 'engine', 'DestructiveZone', customTranslations)}
        description={translate(locale, 'cli', 'WarningResetApp', customTranslations)}
        confirmLabel={translate(locale, 'common', 'Confirm', customTranslations)}
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
            {translate(locale, 'engine', 'HardResetDesc', customTranslations)}
          </Caption>
          <Button
            data-testid="hard-reset-btn"
            variant="destructive"
            onClick={() => setIsResetModalOpen(true)}
            className="bg-rose-500 hover:bg-rose-600 px-6 py-3 rounded-2xl text-white text-xs font-bold uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer whitespace-nowrap h-auto"
          >
            <RefreshCw className="w-4 h-4" /> {translate(locale, 'engine', 'HardResetBtn', customTranslations)}
          </Button>
        </div>
      </CollapsibleCard>
    </>
  );
}

export default DestructiveResetCard;

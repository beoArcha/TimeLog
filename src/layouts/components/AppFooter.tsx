import React from 'react';
import { translate } from '@common/i18n/translator';
import { Locale } from '@/src/bindings/Locale';
import { Button } from '@components/ui/button';

interface AppFooterProps {
  locale: Locale;
  customTranslations: any;
  handleResetLocalStorage: () => void;
  setShowCreditsModal: (show: boolean) => void;
}

export default function AppFooter({
  locale,
  customTranslations,
  handleResetLocalStorage,
  setShowCreditsModal,
}: AppFooterProps) {
  return (
    <footer className="mt-auto bg-black/50 border-t border-white/10 py-5 px-6 text-center text-[10px] text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
        <p>OxyFlowOS Environment — SQLite MicroORM</p>
        <span className="text-white/20 select-none">•</span>
        <Button
          id="trigger-credits-modal-btn"
          variant="link"
          size="xs"
          onClick={() => setShowCreditsModal(true)}
          className="text-teal-400 hover:text-teal-300 font-bold underline transition-colors cursor-pointer p-0 h-auto"
        >
          {translate(locale, 'help', 'MplLicenseCreditsOxyFlow', customTranslations)}
        </Button>
      </div>
      <div className="flex gap-4 items-center">
        <span>{translate(locale, 'engine', 'Ready', customTranslations)}</span>
        <Button
          id="db-clean-force-btn"
          variant="link"
          size="xs"
          onClick={handleResetLocalStorage}
          className="text-orange-500 hover:text-orange-400 font-bold transition-all cursor-pointer p-0 h-auto"
        >
          {translate(locale, 'engine', 'SqlReset', customTranslations)}
        </Button>
      </div>
    </footer>
  );
}

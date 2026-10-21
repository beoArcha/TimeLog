import React from 'react';
import { translate } from '@common/i18n/translator';
import { TranslationDictionary } from '@common/i18n/types';
import { Locale } from '@/src/bindings/Locale';
import { Button } from '@components/ui/button';

interface AppFooterProps {
  locale: Locale;
  customTranslations?: Partial<TranslationDictionary>;
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
    <footer className="mt-auto bg-black/40 backdrop-blur-md border-t border-border/40 py-1.5 px-3 sm:py-2 sm:px-6 text-xs text-muted-foreground flex flex-row items-center justify-between gap-2 font-mono whitespace-nowrap overflow-x-auto select-none">
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <span className="hidden sm:inline font-semibold">OxyFlowOS</span>
        <span className="hidden sm:inline text-muted-foreground/60">Environment — SQLite MicroORM</span>
        <span className="hidden sm:inline text-white/20 select-none">•</span>
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
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <span className="hidden sm:inline">{translate(locale, 'engine', 'Ready', customTranslations)}</span>
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

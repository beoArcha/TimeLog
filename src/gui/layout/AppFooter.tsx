import React from 'react';
import { translate } from '@core/i18n/i18n';
import { LocaleType, TranslationDictionary } from '@core/i18n/translations';
import { DynamicKey } from '@core/i18n/keys/DynamicKey';

interface AppFooterProps {
  locale: LocaleType;
  customTranslations: Partial<TranslationDictionary>;
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
    <footer className="mt-auto bg-black/50 border-t border-white/10 py-5 px-6 text-center text-[10px] text-[#8A7A71] flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
        <p>OxyFlowOS Environment — SQLite MicroORM</p>
        <span className="text-white/20 select-none">•</span>
        <button
          id="trigger-credits-modal-btn"
          onClick={() => setShowCreditsModal(true)}
          className="text-teal-400 hover:text-teal-300 font-bold underline transition-colors cursor-pointer"
        >
          {translate(locale, DynamicKey.MitLicenseCreditsOxyFlow, customTranslations)}
        </button>
      </div>
      <div className="flex gap-4">
        <span>Silnik: <strong className="text-[#9B8C83] font-semibold">Ready</strong></span>
        <button
          id="db-clean-force-btn"
          onClick={handleResetLocalStorage}
          className="text-orange-455 hover:text-orange-300 font-bold transition-all cursor-pointer"
        >
          Wyczyść Baze (SQL Reset)
        </button>
      </div>
    </footer>
  );
}

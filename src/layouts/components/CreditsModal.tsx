import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@components/ui/button';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useSettings } from '@common/hooks/SettingsContext';

export default function CreditsModal() {
  const { locale, customTranslations } = useLocale();
  const { showCreditsModal, setShowCreditsModal } = useSettings();

  if (!showCreditsModal || !setShowCreditsModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          id="credits-modal-container"
          role="dialog"
          aria-modal="true"
          aria-labelledby="credits-modal-title"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-2xl rounded-[2.5rem] border border-border shadow-2xl p-8 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto bg-card text-card-foreground"
        >
          <Button
            id="close-credits-modal-btn"
            variant="ghost"
            size="icon"
            onClick={() => setShowCreditsModal(false)}
            className="absolute top-6 right-6 p-2 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-muted"
            title={translate(locale, 'common', 'Close', customTranslations)}
            aria-label={translate(locale, 'common', 'Close', customTranslations)}
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="border-b pb-4 border-border">
            <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
              {translate(locale, 'help', 'CreditsBadge', customTranslations)}
            </span>
            <h3 id="credits-modal-title" className="font-sans font-bold text-2xl mt-2 flex items-center gap-2 text-foreground">
              <Sparkles className="w-6 h-6 text-orange-400 animate-pulse" />
              {translate(locale, 'help', 'AboutFlowCreditsMpl', customTranslations)}
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
              🕺 {translate(locale, 'help', 'AboutCreatorVibeCodingVibe', customTranslations)}
            </h4>
            <div className="p-5 rounded-3xl border border-border bg-muted/40 text-foreground transition-all">
              <p className="font-sans text-sm leading-relaxed mb-3">
                {translate(locale, 'help', 'CreatorAppCreatedBy', customTranslations)}
              </p>
              <p className="font-sans text-xs leading-relaxed text-muted-foreground">
                {translate(locale, 'help', 'CreatorBio', customTranslations)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                💖 {translate(locale, 'help', 'ComponentCreatorsAcknowledgement', customTranslations)}
              </h4>
              <ul className="p-4 rounded-3xl border border-border list-disc pl-5 text-xs flex flex-col gap-1.5 leading-relaxed bg-muted/40 text-foreground">
                <li><strong className="text-orange-400">Lucide React</strong>: {translate(locale, 'help', 'ForGorgeousConsistentVectorIco', customTranslations)}</li>
                <li><strong className="text-orange-400">Motion / Framer Motion</strong>: {translate(locale, 'help', 'ForCinematicReactiveStateTrans', customTranslations)}</li>
                <li><strong className="text-orange-400">Tailwind CSS v4</strong>: {translate(locale, 'help', 'ForRapidElegantResponsiveUtili', customTranslations)}</li>
                <li><strong className="text-orange-400">Vite & React 18</strong>: {translate(locale, 'help', 'ForImmediateDevIterationsAndSo', customTranslations)}</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-mono font-bold tracking-wider text-muted-foreground uppercase">
                📄 {translate(locale, 'help', 'MplLicense', customTranslations)}
              </h4>
              <div className="p-4 rounded-3xl border border-border text-[9px] font-mono leading-relaxed h-[120px] overflow-y-auto bg-muted/60 text-muted-foreground">
                <p className="font-bold mb-1">Mozilla Public License Version 2.0 (MPL-2.0)</p>
                <p className="mb-2">Copyright (c) 2026 LogTime by OxyFlow</p>
                <p className="mb-2">
                  This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
                  If a copy of the MPL was not distributed with this file, You can obtain one at
                  https://mozilla.org/MPL/2.0/.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 border-border mt-2">
            <Button
              id="close-credits-overlay-btn"
              onClick={() => setShowCreditsModal(false)}
              className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl px-5 py-2.5 shadow-md cursor-pointer transition-all"
              aria-label={translate(locale, 'help', 'GreatClose', customTranslations)}
            >
              {translate(locale, 'help', 'GreatClose', customTranslations)}
            </Button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

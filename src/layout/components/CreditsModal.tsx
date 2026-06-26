import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';
import { useOxyFlow } from '@common/providers/OxyContext';
import { translate } from '@common/i18n/i18n';
import { DynamicKey } from '@common/i18n/keys/DynamicKey';

export default function CreditsModal() {
  const {
    showCreditsModal,
    setShowCreditsModal,
    resolvedTheme,
    locale,
    customTranslations
  } = useOxyFlow();

  if (!showCreditsModal || !setShowCreditsModal) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          id="credits-modal-container"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.3 }}
          className={`w-full max-w-2xl rounded-[2.5rem] border shadow-2xl p-8 flex flex-col gap-6 relative max-h-[90vh] overflow-y-auto ${resolvedTheme === 'light'
              ? 'bg-[#FCFAF8] border-[#DFD7CB] text-[#2C2421]'
              : resolvedTheme === 'high-contrast'
                ? 'bg-black border-2 border-white text-white'
                : 'bg-slate-950 border-white/10 text-white'
            }`}
        >
          <button
            id="close-credits-modal-btn"
            onClick={() => setShowCreditsModal(false)}
            className={`absolute top-6 right-6 p-2 rounded-2xl transition-colors cursor-pointer ${resolvedTheme === 'light' ? 'hover:bg-[#EAE4DB] text-[#5A4A42]' : 'hover:bg-[#FCFAF8]/10 text-[#9B8C83]'
              }`}
            title="Zamknij"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="border-b pb-4 border-white/10">
            <span className="text-[10px] font-mono tracking-wider bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full font-bold uppercase border border-orange-500/25">
              Credits • Acknowledgements • MIT License
            </span>
            <h3 className={`font-sans font-bold text-2xl mt-2 flex items-center gap-2 ${resolvedTheme === 'light' ? 'text-[#2C2421]' : 'text-white'
              }`}>
              <Sparkles className="w-6 h-6 text-orange-400 animate-pulse" />
              {translate(locale, DynamicKey.AboutFlowCreditsMit, customTranslations)}
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase">
              🕺 {translate(locale, DynamicKey.AboutCreatorVibeCodingVibe, customTranslations)}
            </h4>
            <div className={`p-5 rounded-3xl border transition-all ${resolvedTheme === 'light'
                ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#2C2421]'
                : 'bg-[#FCFAF8]/5 border-white/10 text-slate-200'
              }`}>
              <p className="font-sans text-sm leading-relaxed mb-3">
                {locale === 'pl' ? (
                  <>
                    Aplikacja stworzona przez <strong className="text-orange-400">vibe coding</strong> przez <strong className="text-teal-400">LogTime by OxyFlow</strong>.
                  </>
                ) : (
                  <>
                    This application was engineered through <strong className="text-orange-400">vibe coding</strong> by <strong className="text-teal-400 font-extrabold">LogTime by OxyFlow</strong>.
                  </>
                )}
              </p>
              <p className="font-sans text-xs leading-relaxed text-[#9B8C83]">
                {locale === 'pl' ? (
                  <>
                    Nie taki zły tancerz <span className="text-orange-300 font-semibold">Zouka</span> (brazylijskiego), ale też <span className="text-teal-300 font-semibold">Kizomby</span> i <span className="text-pink-300 font-semibold">Bachaty</span>, a do tego cały czas uczy się i rozwija w <span className="text-yellow-300 font-semibold">Salsie NY</span>. Posiada ponad <strong className="text-white font-extrabold">10+ lat doświadczenia</strong> jako programista, a obecnie realizuje się zawodowo jako <strong className="text-white font-semibold">architekt oprogramowania</strong> oraz lider zespołu IT.
                  </>
                ) : (
                  <>
                    A quite passionate dancer of Brazilian <span className="text-orange-300 font-semibold">Zouk</span>, <span className="text-teal-300 font-semibold">Kizomba</span>, <span className="text-pink-300 font-semibold">Bachata</span>, and continuously perfecting his steps in <span className="text-yellow-300 font-semibold">Salsa NY style</span>. Professionally, he boasts over <strong className="text-white font-extrabold">10+ years of active software developer experience</strong>, currently operating as a high-performance <strong className="text-white font-semibold">software architect</strong> and IT development team lead.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase">
                💖 {translate(locale, DynamicKey.ComponentCreatorsAcknowledgement, customTranslations)}
              </h4>
              <ul className={`p-4 rounded-3xl border list-disc pl-5 text-xs flex flex-col gap-1.5 leading-relaxed ${resolvedTheme === 'light' ? 'bg-[#F4EFEA] border-[#DFD7CB] text-[#5A4A42]' : 'bg-[#FCFAF8]/5 border-white/5 text-slate-300'
                }`}>
                <li><strong className="text-orange-400">Lucide React</strong>: {translate(locale, DynamicKey.ForGorgeousConsistentVectorIco, customTranslations)}</li>
                <li><strong className="text-orange-400">Motion / Framer Motion</strong>: {translate(locale, DynamicKey.ForCinematicReactiveStateTrans, customTranslations)}</li>
                <li><strong className="text-orange-400">Tailwind CSS v4</strong>: {translate(locale, DynamicKey.ForRapidElegantResponsiveUtili, customTranslations)}</li>
                <li><strong className="text-orange-400">Vite & React 18</strong>: {translate(locale, DynamicKey.ForImmediateDevIterationsAndSo, customTranslations)}</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-mono font-bold tracking-wider text-[#9B8C83] uppercase">
                📄 {translate(locale, DynamicKey.MitLicense, customTranslations)}
              </h4>
              <div className={`p-4 rounded-3xl border text-[9px] font-mono leading-relaxed h-[120px] overflow-y-auto ${resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB] text-[#5A4A42] shadow-inner' : 'bg-black/40 border-white/5 text-[#9B8C83]'
                }`}>
                <p className="font-bold mb-1">MIT License</p>
                <p className="mb-2">Copyright (c) 2026 LogTime by OxyFlow</p>
                <p className="mb-2">
                  Permission is hereby granted, free of charge, to any person obtaining a copy
                  of this software and associated documentation files (the "Software"), to deal
                  in the Software without restriction, including without limitation the rights
                  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
                  copies of the Software, and to permit persons to whom the Software is
                  furnished to do so, subject to the following conditions:
                </p>
                <p className="mb-2">
                  The above copyright notice and this permission notice shall be included in all
                  copies or substantial portions of the Software.
                </p>
                <p>
                  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
                  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
                  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
                  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
                  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
                  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
                  SOFTWARE.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4 border-white/10 mt-2">
            <button
              id="close-credits-overlay-btn"
              onClick={() => setShowCreditsModal(false)}
              className="bg-gradient-to-tr from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white font-bold text-xs rounded-xl px-5 py-2.5 hover:opacity-95 transition-opacity cursor-pointer shadow-md"
            >
              {translate(locale, DynamicKey.GreatClose, customTranslations)}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}

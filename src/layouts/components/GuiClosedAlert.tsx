import React from 'react';
import { Cpu } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { useLocale } from '@common/hooks/LocaleProvider';
import { useEngine } from '@common/hooks/EngineContext';

export default function GuiClosedAlert() {
  const { locale, customTranslations } = useLocale();
  const { setIsGuiClosed } = useEngine();;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white flex-col gap-4 font-mono">
      <Cpu className="w-12 h-12 text-orange-500 animate-pulse" />
      <h1 className="text-2xl font-bold">{translate(locale, 'app', 'GuiClosedTitle', customTranslations)}</h1>
      <p className="text-[#9B8C83]">{translate(locale, 'app', 'GuiClosedDesc', customTranslations)}</p>
      <button
        onClick={() => setIsGuiClosed(false)}
        className="px-6 py-2 mt-4 bg-orange-500 hover:bg-orange-600 rounded-lg text-black font-bold cursor-pointer transition-all"
      >
        {translate(locale, 'app', 'RestartGui', customTranslations)}
      </button>
    </div>
  );
}

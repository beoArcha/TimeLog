import React from 'react';
import { Cpu } from 'lucide-react';
import { useOxyFlow } from '@core/providers/OxyContext';
import { translate } from '@core/i18n/i18n';
import { AppKey } from '@core/i18n/keys/AppKey';

export default function GuiClosedAlert() {
  const { locale, customTranslations, setIsGuiClosed } = useOxyFlow();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f19] text-white flex-col gap-4 font-mono">
      <Cpu className="w-12 h-12 text-orange-500 animate-pulse" />
      <h1 className="text-2xl font-bold">{translate(locale, AppKey.GuiClosedTitle, customTranslations)}</h1>
      <p className="text-[#9B8C83]">{translate(locale, AppKey.GuiClosedDesc, customTranslations)}</p>
      <button
        onClick={() => setIsGuiClosed(false)}
        className="px-6 py-2 mt-4 bg-orange-500 hover:bg-orange-600 rounded-lg text-black font-bold cursor-pointer transition-all"
      >
        {translate(locale, AppKey.RestartGui, customTranslations)}
      </button>
    </div>
  );
}

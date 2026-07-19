import React from 'react';
import { Languages } from 'lucide-react';
import { useOxyFlow } from '@common/hooks/OxyContext';

export const LanguageSelector: React.FC = () => {
  const { localePref, setLocalePref, resolvedTheme } = useOxyFlow();

  return (
    <div className={`flex items-center p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
      resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
    }`}>
      <Languages className={`w-3.5 h-3.5 mx-2 ${resolvedTheme === 'light' ? 'text-blue-500' : 'text-blue-400'}`} />
      {(['pl', 'en', 'de', 'es', 'pt-br', 'fr', 'system'] as const).map(l => {
        const isActive = localePref === l;
        return (
          <button
            key={l}
            onClick={() => setLocalePref(l)}
            className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${isActive
              ? resolvedTheme === 'light'
                ? 'bg-blue-500 text-white border border-blue-600 shadow-sm font-bold'
                : 'bg-blue-500 text-white border border-blue-600 font-bold'
              : resolvedTheme === 'light'
                ? 'text-[#8A7A71] hover:text-[#2C2421]'
                : 'text-[#9B8C83] hover:text-white'
              }`}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
};

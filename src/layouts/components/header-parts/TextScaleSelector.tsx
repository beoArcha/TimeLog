import React from 'react';
import { useOxyFlow } from '@common/hooks/OxyContext';

export const TextScaleSelector: React.FC = () => {
  const { textAndIconSize, setTextAndIconSize, resolvedTheme } = useOxyFlow();

  return (
    <div className={`flex p-0.5 rounded-lg border transition-all duration-300 text-[10px] font-sans ${
      resolvedTheme === 'light' ? 'bg-[#EAE4DB] border-[#DFD7CB]' : 'bg-slate-950/40 border-white/10'
    }`}>
      {(['small', 'medium', 'large'] as const).map(scale => {
        const isActive = textAndIconSize === scale;
        const textSize = scale === 'small' ? 'text-[9px]' : scale === 'medium' ? 'text-[11px]' : 'text-[13px]';
        return (
          <button
            key={scale}
            data-testid={`text-scale-${scale}`}
            onClick={() => setTextAndIconSize(scale)}
            className={`px-2.5 py-0.5 rounded-md uppercase transition-all cursor-pointer flex flex-col items-center justify-center min-w-[32px] ${isActive
              ? resolvedTheme === 'light'
                ? 'bg-[#FCFAF8] text-indigo-600 border border-[#DFD7CB] shadow-sm font-bold'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold'
              : resolvedTheme === 'light'
                ? 'text-[#8A7A71] hover:text-[#2C2421]'
                : 'text-[#9B8C83] hover:text-white'
              }`}
          >
            <span className={`font-serif leading-none font-bold ${textSize}`}>A</span>
          </button>
        );
      })}
    </div>
  );
};

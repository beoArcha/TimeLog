
import React, { useState } from 'react';
import BaseGui from './BaseGui';
import { GuiState } from './useGuiLogic';
import type { GuiRouterProps } from './GuiRouter';
import { Layers } from 'lucide-react';

type MediumGuiProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function MediumGui({ state, ...rest }: MediumGuiProps) {
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const resolvedTheme = state.theme === 'light' ? 'light' : 'dark'; // simplify
  
  return (
    <div className={`flex flex-col gap-6 max-w-[440px] mx-auto p-4 rounded-[2rem] border shadow-2xl pb-10 transition-colors ${
      resolvedTheme === 'light' ? 'bg-[#F4EFEA]/80 border-[#DFD7CB] shadow-orange-900/5' : 'bg-black/20 border-white/10'
    }`}>
      <BaseGui state={state} isCondensed={true} />
    </div>
  );
}

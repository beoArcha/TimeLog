
import React, { useState } from 'react';
import BaseGui from './BaseGui';
import { GuiState } from './useGuiLogic';
import type { GuiRouterProps } from './GuiRouter';
import { Layers } from 'lucide-react';

type MediumGuiProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function MediumGui({ state, ...rest }: MediumGuiProps) {
  const resolvedTheme = state.theme === 'light' ? 'light' : 'dark'; // simplify
  
  return (
    <div className="w-full h-full flex flex-col p-4 overflow-y-auto">
      <BaseGui state={state} isCondensed={true} />
    </div>
  );
}

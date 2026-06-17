
import React from 'react';
import BaseGui from './BaseGui';
import { GuiState } from './useGuiLogic';
import type { GuiRouterProps } from './GuiRouter';

type LargeGuiProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function LargeGui({ state, ...rest }: LargeGuiProps) {
  return <BaseGui state={state} isCondensed={false} />;
}

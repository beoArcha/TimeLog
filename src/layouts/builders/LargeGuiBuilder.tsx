import React from 'react';
import LargeGui from '../LargeGui';
import { GuiState } from '../hooks/useGuiLogic';
import type { GuiRouterProps } from '../types/GuiCommonProps';

type LargeGuiBuilderProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function LargeGuiBuilder({ state, ...rest }: LargeGuiBuilderProps) {
  return <LargeGui state={state} {...rest} />;
}

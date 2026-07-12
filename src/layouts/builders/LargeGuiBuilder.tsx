import React from 'react';
import LargeGui from '../FullLayout';
import { GuiState } from '../hooks/useGuiLogic';
import type { GuiRouterProps } from '../types/LayoutCommonProps';

type LargeGuiBuilderProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function LargeGuiBuilder({ state, ...rest }: LargeGuiBuilderProps) {
  return <LargeGui state={state} {...rest} />;
}

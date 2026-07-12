import React from 'react';
import FullLayout from '../FullLayout';
import { GuiState } from '../hooks/useGuiLogic';
import type { GuiRouterProps } from '../types/LayoutCommonProps';

type FullLayoutBuilderProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function LargeGuiBuilder({ state, ...rest }: FullLayoutBuilderProps) {
  return <FullLayout state={state} {...rest} />;
}

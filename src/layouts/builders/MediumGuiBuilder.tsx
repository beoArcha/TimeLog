import React from 'react';
import MediumLayout from '../MediumLayout';
import { GuiState } from '../hooks/useGuiLogic';
import type { GuiRouterProps } from '../types/LayoutCommonProps';

type MediumGuiBuilderProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function MediumGuiBuilder({ state, ...rest }: MediumGuiBuilderProps) {
  return <MediumLayout state={state} {...rest} />;
}

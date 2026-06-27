import React from 'react';
import MediumGui from '../MediumGui';
import { GuiState } from '../hooks/useGuiLogic';
import type { GuiRouterProps } from '../types/GuiCommonProps';

type MediumGuiBuilderProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function MediumGuiBuilder({ state, ...rest }: MediumGuiBuilderProps) {
  return <MediumGui state={state} {...rest} />;
}

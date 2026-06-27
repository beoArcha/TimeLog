import React from 'react';
import SmallGui from '../SmallGui/SmallGui';
import { GuiState } from '../useGuiLogic';
import type { GuiRouterProps } from '../GuiCommonProps';

type SmallGuiBuilderProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function SmallGuiBuilder({ state, ...rest }: SmallGuiBuilderProps) {
  return <SmallGui state={state} {...rest} />;
}

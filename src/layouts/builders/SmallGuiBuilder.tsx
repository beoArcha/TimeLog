import React from 'react';
import SmallGui from '../small-gui/CompactLayout';
import { GuiState } from '../hooks/useGuiLogic';
import type { GuiRouterProps } from '../types/LayoutCommonProps';

type SmallGuiBuilderProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function SmallGuiBuilder({ state, ...rest }: SmallGuiBuilderProps) {
  return <SmallGui state={state} {...rest} />;
}

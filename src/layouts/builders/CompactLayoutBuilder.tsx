import React from 'react';
import CompactLayout from '../small-gui/CompactLayout';
import { GuiState } from '../hooks/useGuiLogic';
import type { GuiRouterProps } from '../types/LayoutCommonProps';

type CompactLayoutBuilderProps = Omit<GuiRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function SmallGuiBuilder({ state, ...rest }: CompactLayoutBuilderProps) {
  return <CompactLayout state={state} {...rest} />;
}

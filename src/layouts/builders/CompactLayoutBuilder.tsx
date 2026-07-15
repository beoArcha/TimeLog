import React from 'react';
import CompactLayout from '../compact/CompactLayout';
import { GuiState } from '../hooks/useGuiLogic';
import type { LayoutRouterProps } from '../types/LayoutCommonProps';

type CompactLayoutBuilderProps = Omit<LayoutRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function CompactLayoutBuilder({ state, ...rest }: CompactLayoutBuilderProps) {
  return <CompactLayout state={state} {...rest} />;
}

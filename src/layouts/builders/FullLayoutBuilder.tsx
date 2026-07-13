import React from 'react';
import FullLayout from '../FullLayout';
import { GuiState } from '../hooks/useGuiLogic';
import type { LayoutRouterProps } from '../types/LayoutCommonProps';

type FullLayoutBuilderProps = Omit<LayoutRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function FullLayoutBuilder({ state, ...rest }: FullLayoutBuilderProps) {
  return <FullLayout state={state} {...rest} />;
}

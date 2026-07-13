import React from 'react';
import MediumLayout from '../MediumLayout';
import { GuiState } from '../hooks/useGuiLogic';
import type { LayoutRouterProps } from '../types/LayoutCommonProps';

type MediumLayoutBuilderProps = Omit<LayoutRouterProps, 'variant' | 'commonProps'> & { state: GuiState };

export default function MediumLayoutBuilder({ state, ...rest }: MediumLayoutBuilderProps) {
  return <MediumLayout state={state} {...rest} />;
}

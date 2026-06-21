import React from 'react';
import SmallGui from './SmallGui';
import MediumGui from './MediumGui';
import LargeGui from './LargeGui';
import { GuiCommonProps } from './GuiCommonProps';
import { useGuiLogic } from './useGuiLogic';

import { GuiSize } from '@bindings/GuiSize';

export interface GuiRouterProps {
  variant: GuiSize;
  commonProps: GuiCommonProps;
  
  // Specific toggles
  isSmallExpanded: boolean;
  setIsSmallExpanded: (val: boolean) => void;
  showToast: (msg: string) => void;
  handleMinimizeToTray: () => void;
  setGuiSize: (variant: GuiSize) => void;
  currentProjectId: string;
  lastNonSmallVariant?: Exclude<GuiSize, 'small'>;
}

export default function GuiRouter(props: GuiRouterProps) {
  const { variant, commonProps, ...rest } = props;
  
  const guiState = useGuiLogic(commonProps);
  
  if (variant === 'small') {
    return <SmallGui state={guiState} {...rest} />;
  }
  
  if (variant === 'medium') {
    return <MediumGui state={guiState} {...rest} />;
  }
  
  return <LargeGui state={guiState} {...rest} />;
}

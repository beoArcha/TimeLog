import React from 'react';
import SmallGui from './SmallGui';
import MediumGui from './MediumGui';
import LargeGui from './LargeGui';
import { GuiCommonProps } from './GuiCommonProps';
import { useGuiLogic } from './useGuiLogic';

export interface GuiRouterProps {
  variant: 'small' | 'medium' | 'large';
  commonProps: GuiCommonProps;
  
  // Specific toggles
  isSmallExpanded: boolean;
  setIsSmallExpanded: (val: boolean) => void;
  showToast: (msg: string) => void;
  handleMinimizeToTray: () => void;
  setGuiVariant: (variant: 'small' | 'medium' | 'large') => void;
  currentProjectId: string;
  lastNonSmallVariant?: 'medium' | 'large';
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

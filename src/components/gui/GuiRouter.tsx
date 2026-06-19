import React from 'react';
import SmallGui from './SmallGui';
import MediumGui from './MediumGui';
import LargeGui from './LargeGui';
import { GuiCommonProps } from './GuiCommonProps';
import { useGuiLogic } from './useGuiLogic';

import { GuiVariant } from '../../bindings/GuiVariant';

export interface GuiRouterProps {
  variant: GuiVariant;
  commonProps: GuiCommonProps;
  
  // Specific toggles
  isSmallExpanded: boolean;
  setIsSmallExpanded: (val: boolean) => void;
  showToast: (msg: string) => void;
  handleMinimizeToTray: () => void;
  setGuiVariant: (variant: GuiVariant) => void;
  currentProjectId: string;
  lastNonSmallVariant?: Exclude<GuiVariant, 'small'>;
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

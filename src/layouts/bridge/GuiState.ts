import { LayoutVariant } from '@bindings/LayoutVariant';
import { TextAndIconSize } from '@bindings/TextAndIconSize';

import { Theme } from '@common/types/ThemeTypes';

export interface GuiState {
  layoutVariant: LayoutVariant;
  resolvedTheme: Theme;
  textAndIconSize: TextAndIconSize;
}

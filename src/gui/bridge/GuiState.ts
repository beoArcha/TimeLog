import { GuiSize } from '@bindings/GuiSize';
import { TextAndIconSize } from '@bindings/TextAndIconSize';

import { Theme } from '@common/types/ThemeTypes';

export interface GuiState {
  guiSize: GuiSize;
  resolvedTheme: Theme;
  textAndIconSize: TextAndIconSize;
}

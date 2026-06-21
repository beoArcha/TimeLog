import { GuiSize } from '@bindings/GuiSize';
import { TextAndIconSize } from '@bindings/TextAndIconSize';

export interface GuiState {
  guiSize: GuiSize;
  resolvedTheme: 'light' | 'dark' | 'high-contrast';
  textAndIconSize: TextAndIconSize;
}

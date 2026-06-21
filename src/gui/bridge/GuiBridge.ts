import { GuiState } from './GuiState';
import { useOxyFlow } from '@core/providers/OxyContext';

export type GuiIntent =
  | { type: 'MINIMIZE_TO_TRAY' }
  | { type: 'CLOSE_WINDOW' }
  | { type: 'MINIMIZE_WINDOW' }
  | { type: 'SET_GUI_SIZE'; payload: GuiState['guiSize'] }
  | { type: 'SET_TEXT_AND_ICON_SIZE'; payload: GuiState['textAndIconSize'] };

export const GuiBridge = {
  sendIntent: async (intent: GuiIntent, oxyFlowState?: any): Promise<void> => {
    console.log('[GuiBridge] Sending intent:', intent);
    if (!oxyFlowState) return;

    // Delegate to the current react-based context handler/fallback
    switch (intent.type) {
      case 'MINIMIZE_TO_TRAY':
        if (oxyFlowState.handleMinimizeToTray) {
          await oxyFlowState.handleMinimizeToTray();
        }
        break;
      case 'CLOSE_WINDOW':
        if (oxyFlowState.setIsGuiClosed) {
          oxyFlowState.setIsGuiClosed(true);
        }
        break;
      case 'MINIMIZE_WINDOW':
        if (oxyFlowState.setIsMinimized) {
          oxyFlowState.setIsMinimized(true);
        }
        break;
      case 'SET_GUI_SIZE':
        if (oxyFlowState.setGuiSize) {
          oxyFlowState.setGuiSize(intent.payload);
        }
        break;
      case 'SET_TEXT_AND_ICON_SIZE':
        if (oxyFlowState.setTextAndIconSize) {
          oxyFlowState.setTextAndIconSize(intent.payload);
        }
        break;
      default:
        break;
    }
  }
};

export function useGuiState(): GuiState {
  const state = useOxyFlow();
  return {
    guiSize: state.guiSize,
    resolvedTheme: state.resolvedTheme,
    textAndIconSize: state.textAndIconSize,
  };
}

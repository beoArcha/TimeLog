import { GuiState } from './GuiState';
import { useOxyFlow, OxyFlowState } from '@common/hooks/OxyContext';
import { GuiSize } from '@bindings/GuiSize';
import { TextAndIconSize } from '@bindings/TextAndIconSize';

export type GuiIntent =
  | { type: 'set_gui_size'; payload: { size: GuiSize; textAndIconSize: TextAndIconSize } }
  | { type: 'set_always_on_top'; payload: { alwaysOnTop: boolean } }
  | { type: 'set_minimize_to_tray'; payload: { minimize: boolean } }
  | { type: 'hide_window' }
  | { type: 'exit_app' }
  | { type: 'close_window' }
  | { type: 'minimize_window' }
  | { type: 'show_window' }
  | { type: 'resize_window'; payload: { width: number; height: number } }
  | { type: 'set_window_resizable'; payload: { resizable: boolean } }
  | { type: 'start_timer'; payload: { taskId: string } }
  | { type: 'stop_timer'; payload: { projectId: string | null } };

export const GuiBridge = {
  sendIntent: async (intent: GuiIntent, oxyFlowState?: OxyFlowState): Promise<void> => {
    console.log('[GuiBridge] Sending intent:', intent);
    if (!oxyFlowState) return;

    switch (intent.type) {
      case 'set_gui_size':
        if (oxyFlowState.setGuiSize) {
          oxyFlowState.setGuiSize(intent.payload.size);
        }
        if (oxyFlowState.setTextAndIconSize) {
          oxyFlowState.setTextAndIconSize(intent.payload.textAndIconSize);
        }
        break;
      case 'set_always_on_top':
        if (oxyFlowState.guiSize === 'small') {
          if (oxyFlowState.setAlwaysOnTopSmall) {
            oxyFlowState.setAlwaysOnTopSmall(intent.payload.alwaysOnTop);
          }
        } else {
          if (oxyFlowState.setAlwaysOnTopMain) {
            oxyFlowState.setAlwaysOnTopMain(intent.payload.alwaysOnTop);
          }
        }
        break;
      case 'set_minimize_to_tray':
        if (oxyFlowState.setMinimizeToTray) {
          oxyFlowState.setMinimizeToTray(intent.payload.minimize);
        }
        break;
      case 'hide_window':
        if (oxyFlowState.handleMinimizeToTray) {
          await oxyFlowState.handleMinimizeToTray();
        }
        break;
      case 'exit_app':
        if (oxyFlowState.setIsGuiClosed) {
          oxyFlowState.setIsGuiClosed(true);
        }
        break;
      case 'close_window':
        if (oxyFlowState.setIsGuiClosed) {
          oxyFlowState.setIsGuiClosed(true);
        }
        break;
      case 'minimize_window':
        if (oxyFlowState.setIsMinimized) {
          oxyFlowState.setIsMinimized(true);
        }
        break;
      case 'show_window':
        if (oxyFlowState.setIsMinimized) {
          oxyFlowState.setIsMinimized(false);
        }
        break;
      case 'start_timer':
        if (oxyFlowState.handleStartTimer) {
          oxyFlowState.handleStartTimer(intent.payload.taskId);
        }
        break;
      case 'stop_timer':
        if (oxyFlowState.handleStopTimer) {
          oxyFlowState.handleStopTimer(intent.payload.projectId ?? undefined);
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

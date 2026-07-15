import { WindowCommand } from '@bindings/WindowCommand';
import { AppCommand } from '@bindings/AppCommand';

export const TAURI_COMMANDS = {
  SET_LAYOUT_VARIANT: 'set_layout_variant' as WindowCommand,
  SET_ALWAYS_ON_TOP: 'set_always_on_top' as WindowCommand,
  SET_MINIMIZE_TO_TRAY: 'set_minimize_to_tray' as AppCommand,
  HIDE_WINDOW: 'hide' as WindowCommand,
  EXIT_APP: 'exit_app' as AppCommand,
  CLOSE_WINDOW: 'close' as WindowCommand,
  MINIMIZE_WINDOW: 'minimize' as WindowCommand,
} as const;

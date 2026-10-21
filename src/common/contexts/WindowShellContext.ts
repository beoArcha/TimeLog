import { createContext, useContext } from 'react';
import { type TauriWindowHandle } from '../tauri/useTauriWindow';
import { ContextException } from '../exceptions';
import { AlwaysOnTopConfig } from '@bindings/AlwaysOnTopConfig';

export type WindowShellState = {
  nowIso: string;
  setNowIso: (iso: string) => void;
} & TauriWindowHandle & {
  handleToggleTimer: () => void;
  handleCopyText: (text: string) => void;
  alwaysOnTopConfig: AlwaysOnTopConfig;
};

export const WindowShellContext = createContext<WindowShellState | undefined>(undefined);

export const useWindowShell = (): WindowShellState => {
  const ctx = useContext(WindowShellContext);
  if (!ctx) throw new ContextException('useWindowShell must be used within WindowShellProvider', 'ERR_WINDOW_SHELL_CONTEXT');
  return ctx;
};

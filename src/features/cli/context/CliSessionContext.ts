import { createContext, useContext } from 'react';
import { ContextException } from '@common/exceptions';
import { TerminalLine } from '../types';

export interface CliSessionState {
  terminalHistory: TerminalLine[];
  commandHistory: string[];
  historyIndex: number;
  isSandbox: boolean;
  isDrawerOpen: boolean;
  executeCommand: (cmd: string) => Promise<void>;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
  clearHistory: () => void;
  setSandboxMode: (active: boolean) => void;
  toggleSandbox: () => void;
  navigateHistory: (direction: 'up' | 'down', currentInput: string) => string;
}

export const CliSessionContext = createContext<CliSessionState | null>(null);

export const useCliSession = (): CliSessionState => {
  const context = useContext(CliSessionContext);
  if (!context) {
    throw new ContextException('useCliSession must be used within a CliSessionProvider', 'ERR_CLI_SESSION_CONTEXT');
  }
  return context;
};

export const useCliSessionSafe = (): CliSessionState | null => {
  return useContext(CliSessionContext);
};

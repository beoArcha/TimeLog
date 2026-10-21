import { LayoutCommonProps } from '@layouts/types/LayoutCommonProps';

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
}

export interface CliDomainHandlers {
  isSandbox?: boolean;
  onToggleSandbox?: (enabled?: boolean) => void;
  onSwitchTask?: (targetTaskIdOrName: string) => Promise<void> | void;
}

/**
 * Domain context for CLI commands.
 * Directly extends application domain LayoutCommonProps (DRY) and attaches CLI domain handlers.
 */
export type CliEngineContext = LayoutCommonProps & CliDomainHandlers;

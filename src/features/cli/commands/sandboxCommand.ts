import { translate } from '@common/i18n/translator';
import { CliEngineContext, TerminalLine } from '../types';
import { TerminalOutput } from '../utils/terminalOutput';
import { SandboxEmulatorStore } from '../sandbox/sandboxEmulatorStore';

export const runSandboxCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const subAction = args[0] ? args[0].toLowerCase() : '';
  const store = SandboxEmulatorStore.getInstance();

  switch (subAction) {
    case 'on':
    case 'start':
    case 'enable': {
      store.enable();
      context.onToggleSandbox?.(true);
      terminalOut.success(translate(context.locale, 'cli', 'SandboxModeEnabled', context.customTranslations));
      break;
    }

    case 'off':
    case 'exit':
    case 'disable': {
      store.disable();
      context.onToggleSandbox?.(false);
      terminalOut.info(translate(context.locale, 'cli', 'SandboxModeDisabled', context.customTranslations));
      break;
    }

    case 'status': {
      const isAct = store.isActive() || Boolean(context.isSandbox);
      const statusText = isAct ? 'ACTIVE (In-Memory Simulator)' : 'INACTIVE (Live Engine)';
      terminalOut.info(translate(context.locale, 'cli', 'SandboxModeStatus', context.customTranslations, { status: statusText }));
      break;
    }

    case 'reset': {
      store.reset();
      terminalOut.success(translate(context.locale, 'cli', 'SandboxResetDone', context.customTranslations));
      break;
    }

    default: {
      terminalOut.error('Error: Usage: sandbox <on|off|status|reset>');
      break;
    }
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

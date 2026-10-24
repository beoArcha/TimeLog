import { SandboxEmulatorStore } from './sandboxEmulatorStore';
import { TerminalOutput } from '../utils/terminalOutput';
import { parseFlags, ParsedArgs } from './router/sandboxArgsParser';
import { normalizeLegacyCommand } from './router/sandboxLegacyNormalizer';
import {
  handleProjectList,
  handleProjectAdd,
  handleProjectRename,
  handleProjectArchive,
} from './router/handlers/sandboxProjectHandlers';
import {
  handleTaskList,
  handleTaskAdd,
  handleTaskDone,
  handleTaskRename,
  handleTaskArchive,
} from './router/handlers/sandboxTaskHandlers';
import {
  handleLogList,
  handleLogAdd,
  handleLogRemove,
} from './router/handlers/sandboxLogHandlers';
import {
  handleStatus,
  handleStart,
  handleStop,
  handleSwitch,
  handleToday,
} from './router/handlers/sandboxFlowHandlers';

export { parseFlags, normalizeLegacyCommand };
export type { ParsedArgs };

/**
 * Dispatches noun-verb domain commands for the in-memory sandbox emulator.
 */
export class SandboxCommandRouter {
  public static normalizeLegacyCommand(tokens: string[]): string[] {
    return normalizeLegacyCommand(tokens);
  }

  public static route(
    tokens: string[],
    store: SandboxEmulatorStore,
    output: TerminalOutput
  ): boolean {
    if (tokens.length === 0) return false;

    const domain = tokens[0].toLowerCase();
    const rest = tokens.slice(1);
    const { positionals, flags } = parseFlags(rest);

    switch (domain) {
      case 'project': {
        const action = positionals[0]?.toLowerCase() || 'list';
        const actionPos = positionals.slice(1);
        if (action === 'list' || action === 'ls') {
          handleProjectList(flags, store, output);
          return true;
        }
        if (action === 'add' || action === 'create') {
          handleProjectAdd(actionPos, flags, store, output);
          return true;
        }
        if (action === 'rename' || action === 'ren') {
          handleProjectRename(actionPos, flags, store, output);
          return true;
        }
        if (action === 'archive' || action === 'rm') {
          handleProjectArchive(actionPos, store, output);
          return true;
        }
        output.error(`Error: Unknown project action "${action}". Available: list, add, rename, archive.`, 'CLI_SYNTAX_INVALID_ARGS', 2);
        return true;
      }

      case 'task': {
        const action = positionals[0]?.toLowerCase() || 'list';
        const actionPos = positionals.slice(1);
        if (action === 'list' || action === 'ls') {
          handleTaskList(flags, store, output);
          return true;
        }
        if (action === 'add' || action === 'create') {
          handleTaskAdd(actionPos, flags, store, output);
          return true;
        }
        if (action === 'done' || action === 'complete') {
          handleTaskDone(actionPos, store, output);
          return true;
        }
        if (action === 'rename' || action === 'ren') {
          handleTaskRename(actionPos, store, output);
          return true;
        }
        if (action === 'archive' || action === 'rm') {
          handleTaskArchive(actionPos, store, output);
          return true;
        }
        output.error(`Error: Unknown task action "${action}". Available: list, add, done, rename, archive.`, 'CLI_SYNTAX_INVALID_ARGS', 2);
        return true;
      }

      case 'log': {
        const action = positionals[0]?.toLowerCase() || 'list';
        const actionPos = positionals.slice(1);
        if (action === 'list' || action === 'ls') {
          handleLogList(flags, store, output);
          return true;
        }
        if (action === 'add' || action === 'create') {
          handleLogAdd(actionPos, flags, store, output);
          return true;
        }
        if (action === 'remove' || action === 'rm' || action === 'delete') {
          handleLogRemove(actionPos, store, output);
          return true;
        }
        output.error(`Error: Unknown log action "${action}". Available: list, add, remove.`, 'CLI_SYNTAX_INVALID_ARGS', 2);
        return true;
      }

      case 'status': {
        handleStatus(store, output);
        return true;
      }

      case 'start': {
        handleStart(positionals, store, output);
        return true;
      }

      case 'stop':
      case 'pause': {
        handleStop(flags, store, output);
        return true;
      }

      case 'switch': {
        handleSwitch(positionals, store, output);
        return true;
      }

      case 'today': {
        handleToday(store, output);
        return true;
      }

      default:
        return false;
    }
  }
}

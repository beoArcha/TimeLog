import { translate } from '@common/i18n/translator';
import { CliRouter } from '@common/cli/CliRouter';
import { CliExecutionResult } from '@bindings/CliExecutionResult';
import {
  TerminalLine,
  CliEngineContext,
  TerminalOutput,
  runProjectsCommand,
  runTasksCommand,
  runAddProjectCommand,
  runRenameProjectCommand,
  runAddTaskCommand,
  runAddSubtaskCommand,
  runRenameTaskCommand,
  runStartCommand,
  runStopCommand,
  runStatusCommand,
  runSwitchCommand,
  runTodayCommand,
  runCompleteCommand,
  runLogsCommand,
  runHolidaysCommand,
  runReportCommand,
  runTimeCommand,
  runSandboxCommand,
  SandboxEmulatorStore,
} from './commands';

import { SandboxCommandRouter } from '../sandbox/sandboxCommandRouter';

export type { TerminalLine, CliEngineContext };
export { TerminalOutput };

const formatNativeCliResult = (
  result: CliExecutionResult,
  output: TerminalOutput
): void => {
  if (!result.stdout) return;
  const lines = result.stdout.split('\n');
  for (const line of lines) {
    if (!result.success) {
      output.error(line);
    } else if (line.startsWith('Started') || line.startsWith('Stopped') || line.startsWith('✅')) {
      output.success(line);
    } else {
      output.output(line);
    }
  }
};

const executeNativeCli = async (
  trimmed: string,
  context: CliEngineContext,
  output: TerminalOutput
): Promise<TerminalLine[]> => {
  const cliRouter = CliRouter.getInstance();
  try {
    const result = await cliRouter.execute(trimmed);
    formatNativeCliResult(result, output);
    if (result.success) {
      await context.onRefreshData?.();
    }
  } catch (err: unknown) {
    output.error(err instanceof Error ? err.message : String(err));
  }
  output.empty();
  return output.getLines();
};

export const executeCliCommand = async (cmdText: string, context: CliEngineContext): Promise<TerminalLine[]> => {
  const trimmed = cmdText.trim();
  const sandboxStore = SandboxEmulatorStore.getInstance();
  const isSandboxActive = context.isSandbox || sandboxStore.isActive();

  if (!trimmed) {
    if (!isSandboxActive && CliRouter.getInstance().hasNativeCli()) {
      const output = new TerminalOutput();
      output.input('user@logtime-by-oxyflow:~$ ');
      return executeNativeCli('', context, output);
    }
    return [];
  }

  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const matches: string[] = [];
  let match;
  while ((match = regex.exec(trimmed)) !== null) {
    matches.push(match[1] || match[2] || match[0]);
  }

  if (matches.length === 0) return [];

  const commandName = matches[0].toLowerCase();
  const args = matches.slice(1);
  const output = new TerminalOutput();

  if (commandName === 'clear') {
    return [{ text: '__CLEAR__', type: 'info' }];
  }

  const promptPrefix = isSandboxActive
    ? 'sandbox@oxyflow-simulator:~$ '
    : 'user@logtime-by-oxyflow:~$ ';
  output.input(`${promptPrefix}${trimmed}`);

  if (!isSandboxActive && commandName !== 'sandbox' && CliRouter.getInstance().hasNativeCli()) {
    return executeNativeCli(trimmed, context, output);
  }

  if (isSandboxActive && commandName !== 'sandbox') {
    const normalizedTokens = SandboxCommandRouter.normalizeLegacyCommand(matches);
    const routed = SandboxCommandRouter.route(normalizedTokens, sandboxStore, output);
    if (routed) {
      output.empty();
      return output.getLines();
    }
  }

  const effectiveContext = isSandboxActive
    ? sandboxStore.toCliContext(context)
    : context;

  switch (commandName) {
    case 'help':
    case 'oxyhelp': {
      output.info(translate(effectiveContext.locale, 'cli', 'HelpTitle', effectiveContext.customTranslations));
      output.output(`  projects                      - ${translate(effectiveContext.locale, 'cli', 'ProjectsDesc', effectiveContext.customTranslations)}`);
      output.output(`  tasks <id_projektu/proj_id>   - ${translate(effectiveContext.locale, 'cli', 'TasksDesc', effectiveContext.customTranslations)}`);
      output.output(`  addproject "<nazwa/name>"     - ${translate(effectiveContext.locale, 'cli', 'AddProjectDesc', effectiveContext.customTranslations)}`);
      output.output(`  renameproject <pId> "<name>"  - ${translate(effectiveContext.locale, 'cli', 'RenameProjectDesc', effectiveContext.customTranslations)}`);
      output.output(`  addtask <pId> "<nazwa/name>"  - ${translate(effectiveContext.locale, 'cli', 'AddTaskDesc', effectiveContext.customTranslations)}`);
      output.output(`  renametask <tId> "<name>"     - ${translate(effectiveContext.locale, 'cli', 'RenameTaskDesc', effectiveContext.customTranslations)}`);
      output.output(`  addsubtask <parent_id> "<n>"  - ${translate(effectiveContext.locale, 'cli', 'AddSubtaskDesc', effectiveContext.customTranslations)}`);
      output.output(`  start [task_id]               - ${translate(effectiveContext.locale, 'cli', 'StartDesc', effectiveContext.customTranslations)}`);
      output.output(`  stop [all]                    - ${translate(effectiveContext.locale, 'cli', 'StopDesc', effectiveContext.customTranslations)}`);
      output.output(`  switch <id/name>              - ${translate(effectiveContext.locale, 'cli', 'SwitchDesc', effectiveContext.customTranslations)}`);
      output.output(`  status                        - ${translate(effectiveContext.locale, 'cli', 'StatusDesc', effectiveContext.customTranslations)}`);
      output.output(`  complete <task_id>            - ${translate(effectiveContext.locale, 'cli', 'CompleteDesc', effectiveContext.customTranslations)}`);
      output.output(`  logs                          - ${translate(effectiveContext.locale, 'cli', 'LogsDesc', effectiveContext.customTranslations)}`);
      output.output(`  time <subtask/task/profile> <id> [today/week/month/all] - ${translate(effectiveContext.locale, 'cli', 'TimeCmdDesc', effectiveContext.customTranslations)}`);
      output.output(`  holidays [add type Y-M-D "N"] - ${translate(effectiveContext.locale, 'cli', 'HolidaysDesc', effectiveContext.customTranslations)}`);
      output.output(`  report [today/week/month/all] - ${translate(effectiveContext.locale, 'cli', 'ReportDesc', effectiveContext.customTranslations)}`);
      output.output(`  sandbox [on/off/status/reset] - ${translate(effectiveContext.locale, 'cli', 'SandboxDesc', effectiveContext.customTranslations)}`);
      output.output(`  clear                         - ${translate(effectiveContext.locale, 'cli', 'ClearDesc', effectiveContext.customTranslations)}`);
      output.divider();
      break;
    }

    case 'projects':
    case 'projlist':
      runProjectsCommand(effectiveContext, output);
      break;

    case 'project': {
      const sub = args[0]?.toLowerCase() || 'list';
      if (sub === 'add' || sub === 'create') {
        runAddProjectCommand(args.slice(1), effectiveContext, output);
      } else if (sub === 'rename' || sub === 'ren') {
        runRenameProjectCommand(args.slice(1), effectiveContext, output);
      } else {
        runProjectsCommand(effectiveContext, output);
      }
      break;
    }

    case 'tasks':
      runTasksCommand(args, effectiveContext, output);
      break;

    case 'task': {
      const sub = args[0]?.toLowerCase() || 'list';
      if (sub === 'add' || sub === 'create') {
        runAddTaskCommand(args.slice(1), effectiveContext, output);
      } else if (sub === 'done' || sub === 'complete') {
        runCompleteCommand(args.slice(1), effectiveContext, output);
      } else if (sub === 'rename' || sub === 'ren') {
        runRenameTaskCommand(args.slice(1), effectiveContext, output);
      } else if (sub === 'list' || sub === 'ls') {
        runTasksCommand(args.slice(1), effectiveContext, output);
      } else {
        runTasksCommand(args, effectiveContext, output);
      }
      break;
    }

    case 'addproject':
      runAddProjectCommand(args, effectiveContext, output);
      break;

    case 'renameproject':
      runRenameProjectCommand(args, effectiveContext, output);
      break;

    case 'addtask':
      runAddTaskCommand(args, effectiveContext, output);
      break;

    case 'renametask':
      runRenameTaskCommand(args, effectiveContext, output);
      break;

    case 'addsubtask':
      runAddSubtaskCommand(args, effectiveContext, output);
      break;

    case 'start':
      runStartCommand(args, effectiveContext, output);
      break;

    case 'stop':
    case 'pause':
      runStopCommand(args, effectiveContext, output);
      break;

    case 'break': {
      runStopCommand([], effectiveContext, output);
      const durationStr = args[0] || '5m';
      output.info(`☕ Break started (${durationStr}). Active timer paused.`);
      break;
    }

    case 'switch':
      runSwitchCommand(args, effectiveContext, output);
      break;

    case 'status':
      runStatusCommand(effectiveContext, output);
      break;

    case 'today':
      runTodayCommand(effectiveContext, output);
      break;

    case 'complete':
      runCompleteCommand(args, effectiveContext, output);
      break;

    case 'logs':
      runLogsCommand(args, effectiveContext, output);
      break;

    case 'holidays':
    case 'holiday':
      runHolidaysCommand(args, effectiveContext, output);
      break;

    case 'report':
      await runReportCommand(args, effectiveContext, output);
      break;

    case 'time':
      await runTimeCommand(args, effectiveContext, output);
      break;

    case 'sandbox':
      runSandboxCommand(args, effectiveContext, output);
      break;

    case 'clear':
      return [{ text: '__CLEAR__', type: 'info' }];

    default: {
      const helpTip = translate(effectiveContext.locale, 'cli', 'ErrUnknownCmdHelp', effectiveContext.customTranslations, { command: commandName });
      output.error(`Error: Unknown command "${commandName}". ${helpTip}`, 'CLI_SYNTAX_UNKNOWN_COMMAND', 2);
    }
  }

  output.empty();
  return output.getLines();
};

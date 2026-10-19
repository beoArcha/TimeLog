import { translate } from '@common/i18n/translator';
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
  runCompleteCommand,
  runLogsCommand,
  runHolidaysCommand,
  runReportCommand,
  runTimeCommand
} from './commands';

export type { TerminalLine, CliEngineContext };
export { TerminalOutput };

export const executeCliCommand = async (cmdText: string, context: CliEngineContext): Promise<TerminalLine[]> => {
  const trimmed = cmdText.trim();
  if (!trimmed) return [];

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

  output.input(`user@logtime-by-oxyflow:~$ ${trimmed}`);

  switch (commandName) {
    case 'help':
    case 'oxyhelp': {
      output.info(translate(context.locale, 'cli', 'HelpTitle', context.customTranslations));
      output.output(`  projects                      - ${translate(context.locale, 'cli', 'ProjectsDesc', context.customTranslations)}`);
      output.output(`  tasks <id_projektu/proj_id>   - ${translate(context.locale, 'cli', 'TasksDesc', context.customTranslations)}`);
      output.output(`  addproject "<nazwa/name>"     - ${translate(context.locale, 'cli', 'AddProjectDesc', context.customTranslations)}`);
      output.output(`  renameproject <pId> "<name>"  - ${translate(context.locale, 'cli', 'RenameProjectDesc', context.customTranslations)}`);
      output.output(`  addtask <pId> "<nazwa/name>"  - ${translate(context.locale, 'cli', 'AddTaskDesc', context.customTranslations)}`);
      output.output(`  renametask <tId> "<name>"     - ${translate(context.locale, 'cli', 'RenameTaskDesc', context.customTranslations)}`);
      output.output(`  addsubtask <parent_id> "<n>"  - ${translate(context.locale, 'cli', 'AddSubtaskDesc', context.customTranslations)}`);
      output.output(`  start [task_id]               - ${translate(context.locale, 'cli', 'StartDesc', context.customTranslations)}`);
      output.output(`  stop [all]                    - ${translate(context.locale, 'cli', 'StopDesc', context.customTranslations)}`);
      output.output(`  switch <id/name>              - ${translate(context.locale, 'cli', 'SwitchDesc', context.customTranslations)}`);
      output.output(`  status                        - ${translate(context.locale, 'cli', 'StatusDesc', context.customTranslations)}`);
      output.output(`  complete <task_id>            - ${translate(context.locale, 'cli', 'CompleteDesc', context.customTranslations)}`);
      output.output(`  logs                          - ${translate(context.locale, 'cli', 'LogsDesc', context.customTranslations)}`);
      output.output(`  time <subtask/task/profile> <id> [today/week/month/all] - ${translate(context.locale, 'cli', 'TimeCmdDesc', context.customTranslations)}`);
      output.output(`  holidays [add type Y-M-D "N"] - ${translate(context.locale, 'cli', 'HolidaysDesc', context.customTranslations)}`);
      output.output(`  report [today/week/month/all] - ${translate(context.locale, 'cli', 'ReportDesc', context.customTranslations)}`);
      output.output(`  sandbox [on/off/status/reset] - ${translate(context.locale, 'cli', 'SandboxDesc', context.customTranslations)}`);
      output.output(`  clear                         - ${translate(context.locale, 'cli', 'ClearDesc', context.customTranslations)}`);
      output.divider();
      break;
    }

    case 'projects':
    case 'projlist':
      runProjectsCommand(context, output);
      break;

    case 'tasks':
      runTasksCommand(args, context, output);
      break;

    case 'addproject':
      runAddProjectCommand(args, context, output);
      break;

    case 'renameproject':
      runRenameProjectCommand(args, context, output);
      break;

    case 'addtask':
      runAddTaskCommand(args, context, output);
      break;

    case 'renametask':
      runRenameTaskCommand(args, context, output);
      break;

    case 'addsubtask':
      runAddSubtaskCommand(args, context, output);
      break;

    case 'start':
      runStartCommand(args, context, output);
      break;

    case 'stop':
      runStopCommand(args, context, output);
      break;

    case 'switch':
      runSwitchCommand(args, context, output);
      break;

    case 'status':
      runStatusCommand(context, output);
      break;

    case 'complete':
      runCompleteCommand(args, context, output);
      break;

    case 'logs':
      runLogsCommand(args, context, output);
      break;

    case 'holidays':
    case 'holiday':
      runHolidaysCommand(args, context, output);
      break;

    case 'report':
      await runReportCommand(args, context, output);
      break;

    case 'time':
      await runTimeCommand(args, context, output);
      break;

    case 'clear':
      return [{ text: '__CLEAR__', type: 'info' }];

    default: {
      const helpTip = translate(context.locale, 'cli', 'ErrUnknownCmdHelp', context.customTranslations, { command: commandName });
      output.error(`Error: Unknown command "${commandName}". ${helpTip}`);
    }
  }

  output.empty();
  return output.getLines();
};

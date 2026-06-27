import { translate } from '@common/i18n/i18n';
import {
  TerminalLine,
  CliEngineContext,
  runProjectsCommand,
  runTasksCommand,
  runAddProjectCommand,
  runAddTaskCommand,
  runAddSubtaskCommand,
  runStartCommand,
  runStopCommand,
  runStatusCommand,
  runCompleteCommand,
  runLogsCommand,
  runHolidaysCommand,
  runReportCommand,
  runTimeCommand
} from './Commands';

export type { TerminalLine, CliEngineContext };

export const executeCliCommand = (cmdText: string, context: CliEngineContext): TerminalLine[] => {
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
  const outputs: TerminalLine[] = [];

  outputs.push({ text: `user@logtime-by-oxyflow:~$ ${trimmed}`, type: 'input' });

  switch (commandName) {
    case 'help':
    case 'oxyhelp': {
      outputs.push(
        { text: translate(context.locale, 'dynamic.cliHelpTitle', context.customTranslations), type: 'info' },
        { text: `  projects                      - ${translate(context.locale, 'dynamic.cliProjectsDesc', context.customTranslations)}`, type: 'output' },
        { text: `  tasks <id_projektu/proj_id>   - ${translate(context.locale, 'dynamic.cliTasksDesc', context.customTranslations)}`, type: 'output' },
        { text: `  addproject "<nazwa/name>"     - ${translate(context.locale, 'dynamic.cliAddProjectDesc', context.customTranslations)}`, type: 'output' },
        { text: `  addtask <pId> "<nazwa/name>"  - ${translate(context.locale, 'dynamic.cliAddTaskDesc', context.customTranslations)}`, type: 'output' },
        { text: `  addsubtask <parent_id> "<n>"  - ${translate(context.locale, 'dynamic.cliAddSubtaskDesc', context.customTranslations)}`, type: 'output' },
        { text: `  start [task_id]               - ${translate(context.locale, 'dynamic.cliStartDesc', context.customTranslations)}`, type: 'output' },
        { text: `  stop [all]                    - ${translate(context.locale, 'dynamic.cliStopDesc', context.customTranslations)}`, type: 'output' },
        { text: `  status                        - ${translate(context.locale, 'dynamic.cliStatusDesc', context.customTranslations)}`, type: 'output' },
        { text: `  complete <task_id>            - ${translate(context.locale, 'dynamic.cliCompleteDesc', context.customTranslations)}`, type: 'output' },
        { text: `  logs                          - ${translate(context.locale, 'dynamic.cliLogsDesc', context.customTranslations)}`, type: 'output' },
        { text: `  time <subtask/task/profile> <id> [today/week/month] - ${translate(context.locale, 'dynamic.cliTimeCmdDesc', context.customTranslations)}`, type: 'output' },
        { text: `  holidays [add type Y-M-D "N"] - ${translate(context.locale, 'dynamic.cliHolidaysDesc', context.customTranslations)}`, type: 'output' },
        { text: `  report [today/week/month/all] - ${translate(context.locale, 'dynamic.cliReportDesc', context.customTranslations)}`, type: 'output' },
        { text: `  clear                         - ${translate(context.locale, 'dynamic.cliClearDesc', context.customTranslations)}`, type: 'output' },
        { text: `==================================================================`, type: 'info' }
      );
      break;
    }

    case 'projects':
    case 'projlist':
      runProjectsCommand(context, outputs);
      break;

    case 'tasks':
      runTasksCommand(args, context, outputs);
      break;

    case 'addproject':
      runAddProjectCommand(args, context, outputs);
      break;

    case 'addtask':
      runAddTaskCommand(args, context, outputs);
      break;

    case 'addsubtask':
      runAddSubtaskCommand(args, context, outputs);
      break;

    case 'start':
      runStartCommand(args, context, outputs);
      break;

    case 'stop':
      runStopCommand(args, context, outputs);
      break;

    case 'status':
      runStatusCommand(context, outputs);
      break;

    case 'complete':
      runCompleteCommand(args, context, outputs);
      break;

    case 'logs':
      runLogsCommand(args, context, outputs);
      break;

    case 'holidays':
    case 'holiday':
      runHolidaysCommand(args, context, outputs);
      break;

    case 'report':
      runReportCommand(args, context, outputs);
      break;

    case 'time':
      runTimeCommand(args, context, outputs);
      break;

    case 'clear':
      return [{ text: '__CLEAR__', type: 'info' }];

    default:
      outputs.push({ text: `Nieznane polecenie: "${commandName}". Wpisz "help", aby zobaczyć listę komend.`, type: 'error' });
  }

  outputs.push({ text: '', type: 'output' });
  return outputs;
};

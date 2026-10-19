import { CliEngineContext, TerminalLine } from '../types';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { translate } from '@common/i18n/translator';
import { TerminalOutput } from '../utils/terminalOutput';

export const runProjectsCommand = (
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { projects, metrics, locale, customTranslations } = context;

  if (projects.length === 0) {
    terminalOut.error(translate(locale, 'cli', 'ErrNoProjects', customTranslations));
  } else {
    terminalOut.info('┌──────┬────────────────────────────────┬────────────────────────┐');
    terminalOut.info(translate(locale, 'cli', 'ProjHeader', customTranslations));
    terminalOut.info('├──────┼────────────────────────────────┼────────────────────────┤');
    projects.forEach(p => {
      const totalSecs = metrics?.projects[p.id]?.totalElapsedSeconds ?? 0;
      const timeStr = formatSeconds(totalSecs);
      const idCol = p.id.padEnd(4);
      const nameCol = p.name.slice(0, 30).padEnd(30);
      const timeCol = timeStr.padEnd(22);
      terminalOut.output(`│ ${idCol} │ ${nameCol} │ ${timeCol} │`);
    });
    terminalOut.info('└──────┴────────────────────────────────┴────────────────────────┘');
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

export const runAddProjectCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { onAddProject, locale, customTranslations } = context;
  const name = args[0];

  if (!name) {
    terminalOut.error(translate(locale, 'cli', 'ErrSpecifyProjQuotes', customTranslations));
  } else {
    onAddProject(name, 'indigo');
    terminalOut.success(`${translate(locale, 'cli', 'SuccessCreatedProj', customTranslations)}: ${name}`);
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

export const runRenameProjectCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { projects, onRenameProject, locale, customTranslations } = context;
  const pId = args[0];
  const newName = args[1];

  if (!pId || !newName) {
    terminalOut.error(translate(locale, 'cli', 'ErrUsageRenameProject', customTranslations));
  } else {
    const projExists = projects.some(p => p.id === pId);
    if (!projExists) {
      terminalOut.error(`${translate(locale, 'cli', 'ProjNotExist', customTranslations)} ${pId}`);
    } else {
      onRenameProject?.(pId, newName);
      terminalOut.success(`${translate(locale, 'cli', 'SuccessRenamedProject', customTranslations)}: ${newName}`);
    }
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

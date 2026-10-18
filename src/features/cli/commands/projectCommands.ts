import { CliEngineContext, TerminalLine } from '../types';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { translate } from '@common/i18n/translator';

export const runProjectsCommand = (context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { projects, metrics, locale, customTranslations } = context;
  if (projects.length === 0) {
    outputs.push({ text: translate(locale, 'cli', 'ErrNoProjects', customTranslations), type: 'error' });
  } else {
    outputs.push({ text: '┌──────┬────────────────────────────────┬────────────────────────┐', type: 'info' });
    outputs.push({ text: translate(locale, 'cli', 'ProjHeader', customTranslations), type: 'info' });
    outputs.push({ text: '├──────┼────────────────────────────────┼────────────────────────┤', type: 'info' });
    projects.forEach(p => {
      const totalSecs = metrics?.projects[p.id]?.totalElapsedSeconds ?? 0;
      const timeStr = formatSeconds(totalSecs);
      const idCol = p.id.padEnd(4);
      const nameCol = p.name.slice(0, 30).padEnd(30);
      const timeCol = timeStr.padEnd(22);
      outputs.push({ text: `│ ${idCol} │ ${nameCol} │ ${timeCol} │`, type: 'output' });
    });
    outputs.push({ text: '└──────┴────────────────────────────────┴────────────────────────┘', type: 'info' });
  }
};

export const runAddProjectCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { onAddProject, locale, customTranslations } = context;
  const name = args[0];
  if (!name) {
    outputs.push({ text: translate(locale, 'cli', 'ErrSpecifyProjQuotes', customTranslations), type: 'error' });
  } else {
    onAddProject(name, 'indigo');
    outputs.push({ text: `${translate(locale, 'cli', 'SuccessCreatedProj', customTranslations)}: ${name}`, type: 'success' });
  }
};

export const runRenameProjectCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { projects, onRenameProject, locale, customTranslations } = context;
  const pId = args[0];
  const newName = args[1];
  if (!pId || !newName) {
    outputs.push({ text: translate(locale, 'cli', 'ErrUsageRenameProject', customTranslations), type: 'error' });
  } else {
    const projExists = projects.some(p => p.id === pId);
    if (!projExists) {
      outputs.push({ text: `${translate(locale, 'cli', 'ProjNotExist', customTranslations)} ${pId}`, type: 'error' });
    } else {
      onRenameProject(pId, newName);
      outputs.push({ text: `${translate(locale, 'cli', 'SuccessRenamedProject', customTranslations)}: ${newName}`, type: 'success' });
    }
  }
};


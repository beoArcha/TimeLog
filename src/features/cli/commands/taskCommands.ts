import { CliEngineContext, TerminalLine } from '../types';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { translate } from '@common/i18n/translator';
import { TerminalOutput } from '../utils/terminalOutput';

export const runTasksCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { projects, tasks, metrics, locale, customTranslations, selectedTaskId } = context;
  const pId = args[0];

  if (!pId) {
    terminalOut.error(translate(locale, 'cli', 'RequiresProjId', customTranslations));
    if (!(outputs instanceof TerminalOutput)) terminalOut.mergeInto(outputs);
    return;
  }

  const proj = projects.find(p => p.id === pId);
  if (!proj) {
    terminalOut.error(`${translate(locale, 'cli', 'ProjNotExist', customTranslations)} ${pId}`);
    if (!(outputs instanceof TerminalOutput)) terminalOut.mergeInto(outputs);
    return;
  }

  const projTasks = tasks.filter(t => t.projectId === pId);
  const rootTasks = projTasks.filter(t => !t.parentTaskId);

  if (rootTasks.length === 0) {
    terminalOut.info(`${proj.name}: ${translate(locale, 'cli', 'ProjNoTasksYet', customTranslations)}`);
  } else {
    terminalOut.success(`${translate(locale, 'cli', 'ProjTasksHeader', customTranslations)}: ${proj.name} [ID: ${proj.id}]`);
    rootTasks.forEach(root => {
      const statusSymbol = root.completed ? '[X]' : '[ ]';
      const rootSecs = metrics?.tasks[root.id]?.elapsedSeconds ?? 0;
      const duration = formatSeconds(rootSecs);
      const isSetLabel = root.id === selectedTaskId ? ' (Selected)' : '';
      const text = `${statusSymbol} ID: ${root.id.padEnd(4)} - ${root.name} (${duration})${isSetLabel}`;
      if (root.completed) {
        terminalOut.info(text);
      } else {
        terminalOut.output(text);
      }

      const subs = projTasks.filter(t => t.parentTaskId === root.id);
      subs.forEach(sub => {
        const subStatus = sub.completed ? '[X]' : '[ ]';
        const subSecs = metrics?.tasks[sub.id]?.elapsedSeconds ?? 0;
        const subDuration = formatSeconds(subSecs);
        const isSubSetLabel = sub.id === selectedTaskId ? ' (Selected)' : '';
        terminalOut.info(`      ↳ ${subStatus} ID: ${sub.id.padEnd(4)} - ${sub.name} (${subDuration})${isSubSetLabel}`);
      });
    });
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

export const runAddTaskCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { projects, onAddTask, locale, customTranslations } = context;
  const pId = args[0];
  const taskName = args[1];

  if (!pId || !taskName) {
    terminalOut.error(translate(locale, 'cli', 'ErrUsageAddTask', customTranslations));
  } else {
    const projExists = projects.some(p => p.id === pId);
    if (!projExists) {
      terminalOut.error(`${translate(locale, 'cli', 'ProjNotExist', customTranslations)} ${pId}`);
    } else {
      onAddTask(pId, taskName, null);
      terminalOut.success(`${translate(locale, 'cli', 'SuccessAddedTask', customTranslations)}: ${taskName}`);
    }
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

export const runAddSubtaskCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { tasks, onAddTask, locale, customTranslations } = context;
  const parentId = args[0];
  const subName = args[1];

  if (!parentId || !subName) {
    terminalOut.error(translate(locale, 'cli', 'ErrUsageAddSubtask', customTranslations));
  } else {
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) {
      terminalOut.error(`${translate(locale, 'cli', 'ErrTaskNotExist', customTranslations)} ${parentId}`);
    } else {
      onAddTask(parentTask.projectId, subName, parentId);
      terminalOut.success(`${translate(locale, 'cli', 'SuccessAddedSubtask', customTranslations)}: ${subName}`);
    }
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

export const runCompleteCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { tasks, onToggleTaskComplete, locale, customTranslations } = context;
  const tId = args[0];

  if (!tId) {
    terminalOut.error(translate(locale, 'cli', 'UsageCompleteTask', customTranslations));
  } else {
    const tExists = tasks.some(t => t.id === tId);
    if (!tExists) {
      terminalOut.error(`${translate(locale, 'cli', 'ErrTaskNotExist', customTranslations)} ${tId}`);
    } else {
      onToggleTaskComplete(tId);
      terminalOut.success(`${translate(locale, 'cli', 'TaskToggled', customTranslations)}: ${tId}`);
    }
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

export const runRenameTaskCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput ? outputs : new TerminalOutput();
  const { tasks, onRenameTask, locale, customTranslations } = context;
  const tId = args[0];
  const newName = args[1];

  if (!tId || !newName) {
    terminalOut.error(translate(locale, 'cli', 'ErrUsageRenameTask', customTranslations));
  } else {
    const taskExists = tasks.some(t => t.id === tId);
    if (!taskExists) {
      terminalOut.error(`${translate(locale, 'cli', 'ErrTaskNotExist', customTranslations)} ${tId}`);
    } else {
      onRenameTask?.(tId, newName);
      terminalOut.success(`${translate(locale, 'cli', 'SuccessRenamedTask', customTranslations)}: ${newName}`);
    }
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

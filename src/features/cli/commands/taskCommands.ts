import { CliEngineContext, TerminalLine } from '../utils/Commands';
import { getTaskDurationSeconds, formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { translate } from '@common/i18n/translator';

export const runTasksCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { projects, tasks, logs, nowIso, locale, customTranslations, selectedTaskId } = context;
  const pId = args[0];
  if (!pId) {
    outputs.push({ text: translate(locale, 'cli', 'RequiresProjId', customTranslations), type: 'error' });
    return;
  }
  const proj = projects.find(p => p.id === pId);
  if (!proj) {
    outputs.push({ text: `${translate(locale, 'cli', 'ProjNotExist', customTranslations)} ${pId}`, type: 'error' });
    return;
  }

  const projTasks = tasks.filter(t => t.projectId === pId);
  const rootTasks = projTasks.filter(t => !t.parentTaskId);

  if (rootTasks.length === 0) {
    outputs.push({ text: `${proj.name}: ${translate(locale, 'cli', 'ProjNoTasksYet', customTranslations)}`, type: 'info' });
  } else {
    outputs.push({ text: `${translate(locale, 'cli', 'ProjTasksHeader', customTranslations)}: ${proj.name} [ID: ${proj.id}]`, type: 'success' });
    rootTasks.forEach(root => {
      const statusSymbol = root.completed ? '[X]' : '[ ]';
      const duration = formatSeconds(getTaskDurationSeconds(root.id, tasks, logs, nowIso));
      const isSetLabel = root.id === selectedTaskId ? ' (Selected)' : '';
      outputs.push({
        text: `${statusSymbol} ID: ${root.id.padEnd(4)} - ${root.name} (${duration})${isSetLabel}`,
        type: root.completed ? 'info' : 'output'
      });

      const subs = projTasks.filter(t => t.parentTaskId === root.id);
      subs.forEach(sub => {
        const subStatus = sub.completed ? '[X]' : '[ ]';
        const subDuration = formatSeconds(getTaskDurationSeconds(sub.id, tasks, logs, nowIso));
        const isSubSetLabel = sub.id === selectedTaskId ? ' (Selected)' : '';
        outputs.push({
          text: `      ↳ ${subStatus} ID: ${sub.id.padEnd(4)} - ${sub.name} (${subDuration})${isSubSetLabel}`,
          type: 'info'
        });
      });
    });
  }
};

export const runAddTaskCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { projects, onAddTask, locale, customTranslations } = context;
  const pId = args[0];
  const taskName = args[1];
  if (!pId || !taskName) {
    outputs.push({ text: translate(locale, 'cli', 'ErrUsageAddTask', customTranslations), type: 'error' });
  } else {
    const projExists = projects.some(p => p.id === pId);
    if (!projExists) {
      outputs.push({ text: `${translate(locale, 'cli', 'ProjNotExist', customTranslations)} ${pId}`, type: 'error' });
    } else {
      onAddTask(pId, taskName, null);
      outputs.push({ text: `${translate(locale, 'cli', 'SuccessAddedTask', customTranslations)}: ${taskName}`, type: 'success' });
    }
  }
};

export const runAddSubtaskCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { tasks, onAddTask, locale, customTranslations } = context;
  const parentId = args[0];
  const subName = args[1];
  if (!parentId || !subName) {
    outputs.push({ text: translate(locale, 'cli', 'ErrUsageAddSubtask', customTranslations), type: 'error' });
  } else {
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) {
      outputs.push({ text: `${translate(locale, 'cli', 'ErrTaskNotExist', customTranslations)} ${parentId}`, type: 'error' });
    } else {
      onAddTask(parentTask.projectId, subName, parentId);
      outputs.push({ text: `${translate(locale, 'cli', 'SuccessAddedSubtask', customTranslations)}: ${subName}`, type: 'success' });
    }
  }
};

export const runCompleteCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { tasks, onToggleTaskComplete, locale, customTranslations } = context;
  const tId = args[0];
  if (!tId) {
    outputs.push({ text: translate(locale, 'cli', 'UsageCompleteTask', customTranslations), type: 'error' });
  } else {
    const tExists = tasks.some(t => t.id === tId);
    if (!tExists) {
      outputs.push({ text: `${translate(locale, 'cli', 'ErrTaskNotExist', customTranslations)} ${tId}`, type: 'error' });
    } else {
      onToggleTaskComplete(tId);
      outputs.push({ text: `${translate(locale, 'cli', 'TaskToggled', customTranslations)}: ${tId}`, type: 'success' });
    }
  }
};

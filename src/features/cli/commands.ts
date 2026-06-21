import React from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { Locale } from '@bindings/Locale';
import { getProjectDurationSeconds, getTaskDurationSeconds, formatSeconds } from '@features/timelogs/timelogUtils';
import { translate } from '@core/i18n/i18n';
import { LocalStorageDataManager } from '@core/data/dataManager';
import { STORAGE_KEYS } from '@common/constants';

const dm = new LocalStorageDataManager(STORAGE_KEYS.STATE_DB);

export interface TerminalLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'info';
}

export interface CliEngineContext {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
  onAddProject: (name: string, color: string) => void;
  onAddTask: (projectId: string, name: string, parentTaskId: string | null) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onStartTimer: (taskId: string) => void;
  onStopTimer: (projectId?: string) => void;
  nowIso: string;
  locale: Locale;
  customTranslations?: any;
  holidays: HolidayLeave[];
  setHolidays: React.Dispatch<React.SetStateAction<HolidayLeave[]>>;
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
}

export const runProjectsCommand = (context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { projects, tasks, logs, nowIso, locale, customTranslations } = context;
  if (projects.length === 0) {
    outputs.push({ text: translate(locale, 'dynamic.cliErrNoProjects', customTranslations), type: 'error' });
  } else {
    outputs.push({ text: '┌──────┬────────────────────────────────┬────────────────────────┐', type: 'info' });
    outputs.push({ text: translate(locale, 'dynamic.cliProjHeader', customTranslations), type: 'info' });
    outputs.push({ text: '├──────┼────────────────────────────────┼────────────────────────┤', type: 'info' });
    projects.forEach(p => {
      const timeStr = formatSeconds(getProjectDurationSeconds(p.id, tasks, logs, nowIso));
      const idCol = p.id.padEnd(4);
      const nameCol = p.name.slice(0, 30).padEnd(30);
      const timeCol = timeStr.padEnd(22);
      outputs.push({ text: `│ ${idCol} │ ${nameCol} │ ${timeCol} │`, type: 'output' });
    });
    outputs.push({ text: '└──────┴────────────────────────────────┴────────────────────────┘', type: 'info' });
  }
};

export const runTasksCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { projects, tasks, logs, nowIso, locale, customTranslations, selectedTaskId } = context;
  const pId = args[0];
  if (!pId) {
    outputs.push({ text: translate(locale, 'dynamic.cliRequiresProjId', customTranslations), type: 'error' });
    return;
  }
  const proj = projects.find(p => p.id === pId);
  if (!proj) {
    outputs.push({ text: `${translate(locale, 'dynamic.cliProjNotExist', customTranslations)} ${pId}`, type: 'error' });
    return;
  }

  const projTasks = tasks.filter(t => t.projectId === pId);
  const rootTasks = projTasks.filter(t => t.parentTaskId === null);

  if (rootTasks.length === 0) {
    outputs.push({ text: `${proj.name}: ${translate(locale, 'dynamic.cliProjNoTasksYet', customTranslations)}`, type: 'info' });
  } else {
    outputs.push({ text: `${translate(locale, 'dynamic.cliProjTasksHeader', customTranslations)}: ${proj.name} [ID: ${proj.id}]`, type: 'success' });
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

export const runAddProjectCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { onAddProject, locale, customTranslations } = context;
  const name = args[0];
  if (!name) {
    outputs.push({ text: translate(locale, 'dynamic.cliErrSpecifyProjQuotes', customTranslations), type: 'error' });
  } else {
    onAddProject(name, 'indigo');
    outputs.push({ text: `${translate(locale, 'dynamic.cliSuccessCreatedProj', customTranslations)}: ${name}`, type: 'success' });
  }
};

export const runAddTaskCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { projects, onAddTask, locale, customTranslations } = context;
  const pId = args[0];
  const taskName = args[1];
  if (!pId || !taskName) {
    outputs.push({ text: translate(locale, 'dynamic.cliErrUsageAddTask', customTranslations), type: 'error' });
  } else {
    const projExists = projects.some(p => p.id === pId);
    if (!projExists) {
      outputs.push({ text: `${translate(locale, 'dynamic.cliProjNotExist', customTranslations)} ${pId}`, type: 'error' });
    } else {
      onAddTask(pId, taskName, null);
      outputs.push({ text: `${translate(locale, 'dynamic.cliSuccessAddedTask', customTranslations)}: ${taskName}`, type: 'success' });
    }
  }
};

export const runAddSubtaskCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { tasks, onAddTask, locale, customTranslations } = context;
  const parentId = args[0];
  const subName = args[1];
  if (!parentId || !subName) {
    outputs.push({ text: translate(locale, 'dynamic.cliErrUsageAddSubtask', customTranslations), type: 'error' });
  } else {
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) {
      outputs.push({ text: `${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} ${parentId}`, type: 'error' });
    } else {
      onAddTask(parentTask.projectId, subName, parentId);
      outputs.push({ text: `${translate(locale, 'dynamic.cliSuccessAddedSubtask', customTranslations)}: ${subName}`, type: 'success' });
    }
  }
};

export const runStartCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { tasks, onStartTimer, selectedTaskId, setSelectedTaskId, locale, customTranslations } = context;
  const tId = args[0];
  if (!tId) {
    const currentTaskId = selectedTaskId || (tasks && tasks.length > 0 ? tasks[0].id : null);
    if (!currentTaskId) {
      outputs.push({
        text: locale === 'pl'
          ? 'Błąd: Brak obecnie wybranego zadania. Wybierz zadanie w GUI lub podaj ID, np. start 102.'
          : 'Error: No task is currently selected. Select one in GUI or specify ID, e.g. start 102.',
        type: 'error'
      });
    } else {
      const taskObj = tasks.find(t => t.id === currentTaskId);
      if (!taskObj) {
        outputs.push({
          text: `${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} ${currentTaskId}`,
          type: 'error'
        });
      } else if (taskObj.completed) {
        outputs.push({
          text: `Error: Task "${taskObj.name}" is already completed.`,
          type: 'error'
        });
      } else {
        onStartTimer(currentTaskId);
        outputs.push({
          text: `▶️ Timer started for currently set task: "${taskObj.name}" [ID: ${currentTaskId}]`,
          type: 'success'
        });
      }
    }
  } else {
    const taskObj = tasks.find(t => t.id === tId);
    if (!taskObj) {
      outputs.push({ text: `${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} ${tId}`, type: 'error' });
    } else if (taskObj.completed) {
      outputs.push({ text: `${translate(locale, 'dynamic.cliErrTaskCompleted', customTranslations)} ${taskObj.name}`, type: 'error' });
    } else {
      setSelectedTaskId(tId);
      onStartTimer(tId);
      outputs.push({ text: `▶️ ${translate(locale, 'dynamic.cliTimerStarted', customTranslations)}: ${taskObj.name} [ID: ${tId}]`, type: 'success' });
    }
  }
};

export const runStopCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { logs, activeLog, tasks, onStopTimer } = context;
  const arg = args[0] ? args[0].toLowerCase() : '';
  if (arg === 'all') {
    const activeRunningCount = logs.filter(l => l.endTime === null).length;
    onStopTimer();
    outputs.push({
      text: `⏹️ Stopped all (${activeRunningCount}) active tracking sessions across all projects.`,
      type: 'success'
    });
  } else {
    if (!activeLog) {
      outputs.push({ text: translate(context.locale, 'dynamic.cliNoActiveTimer', context.customTranslations), type: 'info' });
    } else {
      const t = tasks.find(x => x.id === activeLog.taskId);
      onStopTimer();
      outputs.push({ text: `⏹️ Timer stopped for task: "${t?.name || 'Unknown'}". Saved to SQLite.`, type: 'success' });
    }
  }
};

export const runStatusCommand = (context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { activeLog, tasks, projects, logs, nowIso, locale, customTranslations } = context;
  if (activeLog) {
    const t = tasks.find(x => x.id === activeLog.taskId);
    const p = t ? projects.find(x => x.id === t.projectId) : null;
    const diffSeconds = getTaskDurationSeconds(activeLog.taskId, tasks, logs, nowIso);
    outputs.push(
      { text: translate(locale, 'dynamic.cliStatusHeader', customTranslations), type: 'info' },
      { text: `  Task : ${t?.name} (ID: ${t?.id})`, type: 'output' },
      { text: `  Project : ${p?.name} (ID: ${p?.id})`, type: 'output' },
      { text: `  Time    : ${formatSeconds(diffSeconds)} elapsed`, type: 'success' },
      { text: '=========================================================', type: 'info' }
    );
  } else {
    outputs.push({ text: translate(locale, 'dynamic.cliStateIdle', customTranslations), type: 'info' });
  }
};

export const runCompleteCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { tasks, onToggleTaskComplete, locale, customTranslations } = context;
  const tId = args[0];
  if (!tId) {
    outputs.push({ text: translate(locale, 'dynamic.cliUsageCompleteTask', customTranslations), type: 'error' });
  } else {
    const tExists = tasks.some(t => t.id === tId);
    if (!tExists) {
      outputs.push({ text: `${translate(locale, 'dynamic.cliErrTaskNotExist', customTranslations)} ${tId}`, type: 'error' });
    } else {
      onToggleTaskComplete(tId);
      outputs.push({ text: `${translate(locale, 'dynamic.cliTaskToggled', customTranslations)}: ${tId}`, type: 'success' });
    }
  }
};

import { runLogsCommand, runReportCommand, runTimeCommand } from './reportCommands';
export { runLogsCommand, runReportCommand, runTimeCommand };

export const runHolidaysCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { holidays, setHolidays, locale, customTranslations } = context;
  const subAction = args[0] ? args[0].toLowerCase() : '';
  if (subAction === 'add') {
    const type = args[1]?.toLowerCase();
    const date = args[2];
    const name = args[3];
    if (!type || !date || !name || (type !== 'holiday' && type !== 'leave')) {
      outputs.push({
        text: 'Error: Usage: holidays add <holiday|leave> <YYYY-MM-DD> "<name>".',
        type: 'error'
      });
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        outputs.push({ text: translate(locale, 'dynamic.cliInvalidDateFormat', customTranslations), type: 'error' });
      } else {
        const newHoliday: HolidayLeave = {
          id: dm.getNextId(holidays, 'hol_'),
          date,
          type: type as 'holiday' | 'leave',
          name,
        };
        setHolidays(prev => [...prev, newHoliday]);
        outputs.push({
          text: `Success: Saved ${type === 'holiday' ? 'holiday' : 'leave'} "${name}" [${date}] in SQLite table.`,
          type: 'success'
        });
      }
    }
  } else {
    if (holidays.length === 0) {
      outputs.push({ text: translate(locale, 'dynamic.cliNoHolidays', customTranslations), type: 'info' });
    } else {
      outputs.push({ text: '┌──────┬────────────┬─────────────┬────────────────────────────────┐', type: 'info' });
      outputs.push({ text: translate(locale, 'dynamic.cliHolidaysHeader', customTranslations), type: 'info' });
      outputs.push({ text: '├──────┼────────────┼─────────────┼────────────────────────────────┤', type: 'info' });
      holidays.forEach(h => {
        const typeStr = h.type === 'holiday' ? 'HOLIDAY' : 'LEAVE';
        const idCol = h.id.replace('hol_', '').slice(-4).padEnd(4);
        const dateCol = h.date.padEnd(10);
        const typeCol = typeStr.padEnd(11);
        const nameCol = h.name.slice(0, 30).padEnd(30);
        outputs.push({ text: `│ ${idCol} │ ${dateCol} │ ${typeCol} │ ${nameCol} │`, type: 'output' });
      });
      outputs.push({ text: '└──────┴────────────┴─────────────┴────────────────────────────────┘', type: 'info' });
    }
  }
};

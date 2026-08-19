import { CliEngineContext, TerminalLine } from '../utils/Commands';
import { getTaskDurationSeconds, formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { translate } from '@common/i18n/translator';

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
          text: `${translate(locale, 'cli', 'ErrTaskNotExist', customTranslations)} ${currentTaskId}`,
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
      outputs.push({ text: `${translate(locale, 'cli', 'ErrTaskNotExist', customTranslations)} ${tId}`, type: 'error' });
    } else if (taskObj.completed) {
      outputs.push({ text: `${translate(locale, 'cli', 'ErrTaskCompleted', customTranslations)} ${taskObj.name}`, type: 'error' });
    } else {
      setSelectedTaskId(tId);
      onStartTimer(tId);
      outputs.push({ text: `▶️ ${translate(locale, 'cli', 'TimerStarted', customTranslations)}: ${taskObj.name} [ID: ${tId}]`, type: 'success' });
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
      outputs.push({ text: translate(context.locale, 'cli', 'NoActiveTimer', context.customTranslations), type: 'info' });
    } else {
      const t = tasks.find(x => x.id === activeLog.taskId);
      onStopTimer();
      outputs.push({ text: `⏹️ Timer stopped for task: "${t?.name || 'Unknown'}". Saved to SQLite.`, type: 'success' });
    }
  }
};

export const runStatusCommand = (context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { activeLog, tasks, projects, logs, metrics, nowIso, locale, customTranslations } = context;
  if (activeLog) {
    const t = tasks.find(x => x.id === activeLog.taskId);
    const p = t ? projects.find(x => x.id === t.projectId) : null;
    const diffSeconds = metrics?.tasks[activeLog.taskId]?.elapsedSeconds ?? (nowIso ? getTaskDurationSeconds(activeLog.taskId, tasks, logs, nowIso) : 0);
    outputs.push(
      { text: translate(locale, 'cli', 'StatusHeader', customTranslations), type: 'info' },
      { text: `  Task : ${t?.name} (ID: ${t?.id})`, type: 'output' },
      { text: `  Project : ${p?.name} (ID: ${p?.id})`, type: 'output' },
      { text: `  Time    : ${formatSeconds(diffSeconds)} elapsed`, type: 'success' },
      { text: '=========================================================', type: 'info' }
    );
  } else {
    outputs.push({ text: translate(locale, 'cli', 'StateIdle', customTranslations), type: 'info' });
  }
};

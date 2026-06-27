import { TimeLog } from '@bindings/TimeLog';
import { getProjectDurationSeconds, getTaskDurationSeconds, formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { translate } from '@common/i18n/i18n';
import { TerminalLine, CliEngineContext } from './Commands';

export const runLogsCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { logs, nowIso, locale, customTranslations } = context;
  let filteredLogs = [...logs];
  const filterArg = args[0] ? args[0].toLowerCase() : 'all';
  const sortArg = args[1] ? args[1].toLowerCase() : 'date';

  const transRunning = (translate(locale, 'dynamic.filterRunning', customTranslations) || 'running').toLowerCase();
  const transCaptured = (translate(locale, 'dynamic.filterCaptured', customTranslations) || 'captured').toLowerCase();

  if (filterArg === 'running' || filterArg === transRunning) {
    filteredLogs = filteredLogs.filter(log => !log.endTime);
  } else if (filterArg === 'captured' || filterArg === transCaptured || filterArg === 'gotowy') {
    filteredLogs = filteredLogs.filter(log => log.endTime);
  }

  const transDuration = (translate(locale, 'dynamic.sortDuration', customTranslations) || 'duration').toLowerCase();
  const transProject = (translate(locale, 'dynamic.sortProject', customTranslations) || 'project').toLowerCase();
  const transStatus = (translate(locale, 'dynamic.sortStatus', customTranslations) || 'status').toLowerCase();

  if (sortArg === 'duration' || sortArg === transDuration || sortArg === 'czas') {
    filteredLogs.sort((a, b) => {
      const getDur = (log: TimeLog) => {
        const s = new Date(log.startTime).getTime();
        const e = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
        return Math.max(0, e - s);
      };
      return getDur(b) - getDur(a);
    });
  } else if (sortArg === 'project' || sortArg === transProject || sortArg === 'projekt') {
    filteredLogs.sort((a, b) => a.projectId.localeCompare(b.projectId));
  } else if (sortArg === 'status' || sortArg === transStatus) {
    filteredLogs.sort((a, b) => (a.endTime ? 1 : 0) - (b.endTime ? 1 : 0));
  } else {
    filteredLogs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  if (filteredLogs.length === 0) {
    outputs.push({ text: translate(locale, 'dynamic.cliNoLogsFound', customTranslations), type: 'info' });
  } else {
    const hId = (translate(locale, 'dynamic.cliLogId', customTranslations) || 'ID').padEnd(4).substring(0, 4);
    const hPrj = (translate(locale, 'dynamic.cliLogPrjId', customTranslations) || 'PRJ ID').padEnd(6).substring(0, 6);
    const hStart = (translate(locale, 'dynamic.cliLogStart', customTranslations) || 'STARTED AT').padEnd(10).substring(0, 10);
    const hStat = (translate(locale, 'dynamic.cliLogStatus', customTranslations) || 'STATUS').padEnd(8).substring(0, 8);
    const hDur = (translate(locale, 'dynamic.cliLogDuration', customTranslations) || 'DURATION').padEnd(22).substring(0, 22);

    outputs.push({ text: '┌──────┬────────┬────────────┬──────────┬────────────────────────┐', type: 'info' });
    outputs.push({ text: `│ ${hId} │ ${hPrj} │ ${hStart} │ ${hStat} │ ${hDur} │`, type: 'info' });
    outputs.push({ text: '├──────┼────────┼────────────┼──────────┼────────────────────────┤', type: 'info' });
    filteredLogs.forEach(log => {
      const startStr = new Date(log.startTime).toLocaleTimeString().substring(0, 10);
      const finalStatusLabel = log.endTime ? transCaptured.toUpperCase() : transRunning.toUpperCase();

      const start = new Date(log.startTime).getTime();
      const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
      const elapsed = Math.max(0, Math.floor((end - start) / 1000));

      const idCol = log.id.slice(-4).padEnd(4);
      const prjCol = log.projectId.padEnd(6).substring(0, 6);
      const dateCol = startStr.padEnd(10).substring(0, 10);
      const statCol = finalStatusLabel.padEnd(8).substring(0, 8);
      const durCol = formatSeconds(elapsed).padEnd(22).substring(0, 22);
      outputs.push({ text: `│ ${idCol} │ ${prjCol} │ ${dateCol} │ ${statCol} │ ${durCol} │`, type: log.endTime ? 'output' : 'success' });
    });
    outputs.push({ text: '└──────┴────────┴────────────┴──────────┴────────────────────────┘', type: 'info' });
  }
};

export const runReportCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { logs, projects, tasks, nowIso, locale, customTranslations } = context;
  const period = args[0] ? args[0].toLowerCase() : 'all';
  const sortBy = args[1] ? args[1].toLowerCase() : 'duration';

  let startMs = 0;
  const now = new Date(nowIso);

  if (period === 'today') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    startMs = d.getTime();
  } else if (period === 'week') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    startMs = monday.getTime();
  } else if (period === 'month') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    startMs = d.getTime();
  } else {
    startMs = 0;
  }

  const filteredLogs = logs.filter(log => {
    const logTime = new Date(log.startTime).getTime();
    return logTime >= startMs;
  });

  if (filteredLogs.length === 0) {
    outputs.push({ text: `${translate(locale, 'dynamic.cliNoLogsPeriod', customTranslations)} ${period}`, type: 'info' });
    return;
  }

  outputs.push({ text: `================ ${translate(locale, 'dynamic.cliReportTimeHeader', customTranslations)}: ${period.toUpperCase()} (Sort: ${sortBy}) ================`, type: 'info' });
  outputs.push({ text: translate(locale, 'dynamic.cliReportSysList', customTranslations), type: 'info' });

  const sortedLogs = [...filteredLogs];
  if (sortBy === 'date') {
    sortedLogs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } else {
    sortedLogs.sort((a, b) => {
      const durA = (a.endTime ? new Date(a.endTime).getTime() : new Date(nowIso).getTime()) - new Date(a.startTime).getTime();
      const durB = (b.endTime ? new Date(b.endTime).getTime() : new Date(nowIso).getTime()) - new Date(b.startTime).getTime();
      return durB - durA;
    });
  }

  sortedLogs.forEach(log => {
    const p = projects.find(x => x.id === log.projectId);
    const t = tasks.find(x => x.id === log.taskId);
    const start = new Date(log.startTime).getTime();
    const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
    const elapsed = Math.max(0, Math.floor((end - start) / 1000));
    const dateStr = new Date(log.startTime).toLocaleDateString() + ' ' + new Date(log.startTime).toLocaleTimeString();
    outputs.push({
      text: `[${dateStr}] [Proj: ${p?.name || 'N/A'}] Task ID: ${log.taskId} ("${t?.name || 'N/A'}") -> Czas: ${formatSeconds(elapsed)}`,
      type: 'output'
    });
  });

  outputs.push({ text: '', type: 'output' });
  outputs.push({ text: translate(locale, 'dynamic.cliReportGraph', customTranslations), type: 'info' });

  const projectTimeMap: Record<string, number> = {};
  filteredLogs.forEach(log => {
    const start = new Date(log.startTime).getTime();
    const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
    projectTimeMap[log.projectId] = (projectTimeMap[log.projectId] || 0) + Math.max(0, Math.floor((end - start) / 1000));
  });

  const projectDurations = Object.entries(projectTimeMap).map(([pId, seconds]) => {
    const p = projects.find(x => x.id === pId);
    return { name: p?.name || `Project ${pId}`, seconds };
  });

  if (sortBy === 'duration') {
    projectDurations.sort((a, b) => b.seconds - a.seconds);
  } else {
    projectDurations.sort((a, b) => a.name.localeCompare(b.name));
  }

  const maxSec = Math.max(...projectDurations.map(x => x.seconds), 1);
  projectDurations.forEach(pd => {
    const squaresCount = Math.round((pd.seconds / maxSec) * 20);
    const bar = '█'.repeat(squaresCount) + '░'.repeat(20 - squaresCount);
    outputs.push({
      text: `${pd.name.padEnd(28)} [${bar}] ${formatSeconds(pd.seconds)}`,
      type: 'success'
    });
  });

  outputs.push({ text: '=======================================================', type: 'info' });
};

export const runTimeCommand = (args: string[], context: CliEngineContext, outputs: TerminalLine[]): void => {
  const { logs, tasks, projects, nowIso } = context;
  const type = args[0];
  const targetId = args[1];
  const period = args[2] || 'all';

  if (!type || !targetId) {
    outputs.push({ text: 'Error: Usage: time <subtask/task/profile> <id> [today/week/month]', type: 'error' });
    return;
  }

  let dur: number;
  let pName: string;

  const filterLogsByPeriod = (L: TimeLog[]) => L.filter(log => {
    const testDate = new Date(log.startTime);
    const nDate = new Date(nowIso);
    if (period === 'today') {
      return testDate.toDateString() === nDate.toDateString();
    } else if (period === 'week') {
      const diff = nDate.getTime() - testDate.getTime();
      return diff < 7 * 24 * 3600 * 1000;
    } else if (period === 'month') {
      return testDate.getMonth() === nDate.getMonth() && testDate.getFullYear() === nDate.getFullYear();
    }
    return true;
  });

  const filteredLogs = filterLogsByPeriod(logs);

  if (type === 'profile') {
    dur = getProjectDurationSeconds(targetId, tasks, filteredLogs, nowIso);
    pName = projects.find(p => p.id === targetId)?.name || targetId;
  } else if (type === 'task' || type === 'subtask') {
    dur = getTaskDurationSeconds(targetId, tasks, filteredLogs, nowIso);
    pName = tasks.find(t => t.id === targetId)?.name || targetId;
  } else {
    outputs.push({ text: 'Error: Type must be subtask, task, or profile.', type: 'error' });
    return;
  }

  outputs.push({ text: `[${period.toUpperCase()}] Time elapsed for ${type.toUpperCase()} "${pName}": ${formatSeconds(dur)}`, type: 'success' });
};

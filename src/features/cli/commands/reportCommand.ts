import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { EngineRouter } from '@common/engine/EngineRouter';
import { translate } from '@common/i18n/translator';
import { getRangeFilterForPeriod } from '@features/reports/utils/periodRanges';
import { TerminalLine, CliEngineContext } from '../types';
import { TerminalOutput } from '../utils/terminalOutput';

export const runReportCommand = async (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): Promise<void> => {
  const terminalOut = outputs instanceof TerminalOutput
    ? outputs
    : new TerminalOutput();

  const { projects, tasks, nowIso, locale, customTranslations } = context;
  const period = args[0] ? args[0].toLowerCase() : 'all';
  const sortBy = args[1] ? args[1].toLowerCase() : 'duration';

  const refDate = nowIso ? new Date(nowIso) : new Date();
  const rangeResult = getRangeFilterForPeriod(period, refDate);
  const metricsEngine = EngineRouter.getInstance().metrics;
  const rangeMetrics = await metricsEngine.getRangeMetrics(rangeResult.filter, nowIso);

  const clampedLogs = rangeMetrics.clampedLogs;
  if (clampedLogs.length === 0) {
    terminalOut.info(`${translate(locale, 'cli', 'NoLogsPeriod', customTranslations)} ${period}`);
    if (!(outputs instanceof TerminalOutput)) {
      terminalOut.mergeInto(outputs);
    }
    return;
  }

  const periodHeader = translate(locale, 'cli', 'ReportTimeHeader', customTranslations);
  terminalOut.divider(`${periodHeader}: ${period.toUpperCase()} (Sort: ${sortBy})`);
  terminalOut.info(translate(locale, 'cli', 'ReportSysList', customTranslations));

  const sortedLogs = [...clampedLogs];
  if (sortBy === 'date') {
    sortedLogs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } else {
    sortedLogs.sort((a, b) => b.clampedDurationSeconds - a.clampedDurationSeconds);
  }

  sortedLogs.forEach(log => {
    const p = projects.find(x => x.id === log.projectId);
    const t = tasks.find(x => x.id === log.taskId);
    const logTime = log.clampedStartTime || log.startTime;
    const dateStr = new Date(logTime).toLocaleDateString() + ' ' + new Date(logTime).toLocaleTimeString();
    terminalOut.output(`[${dateStr}] [Proj: ${p?.name || 'N/A'}] Task ID: ${log.taskId} ("${t?.name || 'N/A'}") -> Duration: ${formatSeconds(log.clampedDurationSeconds)}`);
  });

  terminalOut.empty();
  terminalOut.info(translate(locale, 'cli', 'ReportGraph', customTranslations));

  const projectDurations = Object.entries(rangeMetrics.projectElapsed).map(([pId, seconds]) => {
    const p = projects.find(x => x.id === pId);
    return { name: p?.name || `Project ${pId}`, seconds };
  });

  if (sortBy === 'duration') {
    projectDurations.sort((a, b) => b.seconds - a.seconds);
  } else {
    projectDurations.sort((a, b) => a.name.localeCompare(b.name));
  }

  const chartItems = projectDurations.map(pd => ({
    name: pd.name,
    seconds: pd.seconds,
    formattedDuration: formatSeconds(pd.seconds)
  }));
  terminalOut.barChart(chartItems);
  terminalOut.divider();

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

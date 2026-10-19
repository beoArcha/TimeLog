import { TimeLog } from '@bindings/TimeLog';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { translate } from '@common/i18n/translator';
import { TerminalLine, CliEngineContext } from '../types';
import { TerminalOutput } from '../utils/terminalOutput';

export const runLogsCommand = (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): void => {
  const terminalOut = outputs instanceof TerminalOutput
    ? outputs
    : new TerminalOutput();

  const { logs, nowIso, locale, customTranslations } = context;
  let filteredLogs = [...logs];
  const filterArg = args[0] ? args[0].toLowerCase() : 'all';
  const sortArg = args[1] ? args[1].toLowerCase() : 'date';

  const transRunning = translate(locale, 'cli', 'FilterRunning', customTranslations).toLowerCase();
  const transCaptured = translate(locale, 'cli', 'FilterCaptured', customTranslations).toLowerCase();

  if (filterArg === 'running' || filterArg === transRunning) {
    filteredLogs = filteredLogs.filter(log => !log.endTime);
  } else if (filterArg === 'captured' || filterArg === transCaptured || filterArg === 'gotowy') {
    filteredLogs = filteredLogs.filter(log => log.endTime);
  }

  const transDuration = translate(locale, 'cli', 'SortDuration', customTranslations).toLowerCase();
  const transProject = translate(locale, 'cli', 'SortProject', customTranslations).toLowerCase();
  const transStatus = translate(locale, 'cli', 'SortStatus', customTranslations).toLowerCase();

  if (sortArg === 'duration' || sortArg === transDuration || sortArg === 'czas') {
    filteredLogs.sort((a, b) => {
      const getDur = (log: TimeLog) => {
        const s = new Date(log.startTime).getTime();
        const e = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso || Date.now()).getTime();
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
    terminalOut.info(translate(locale, 'cli', 'NoLogsFound', customTranslations));
  } else {
    const headers = [
      { label: translate(locale, 'cli', 'LogId', customTranslations), width: 4 },
      { label: translate(locale, 'cli', 'LogPrjId', customTranslations), width: 6 },
      { label: translate(locale, 'cli', 'LogStart', customTranslations), width: 10 },
      { label: translate(locale, 'cli', 'LogStatus', customTranslations), width: 8 },
      { label: translate(locale, 'cli', 'LogDuration', customTranslations), width: 22 },
    ];

    const rows = filteredLogs.map(log => {
      const startStr = new Date(log.startTime).toLocaleTimeString().substring(0, 10);
      const finalStatusLabel = log.endTime ? transCaptured.toUpperCase() : transRunning.toUpperCase();

      const start = new Date(log.startTime).getTime();
      const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso || Date.now()).getTime();
      const elapsed = Math.max(0, Math.floor((end - start) / 1000));

      return {
        cells: [
          log.id.slice(-4),
          log.projectId,
          startStr,
          finalStatusLabel,
          formatSeconds(elapsed)
        ],
        type: (log.endTime ? 'output' : 'success') as TerminalLine['type']
      };
    });

    terminalOut.table(headers, rows);
  }

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

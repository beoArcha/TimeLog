import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { EngineRouter } from '@common/engine/EngineRouter';
import { getRangeFilterForPeriod } from '@features/reports/utils/periodRanges';
import { TerminalLine, CliEngineContext } from '../types';
import { TerminalOutput } from '../utils/terminalOutput';

export const runTimeCommand = async (
  args: string[],
  context: CliEngineContext,
  outputs: TerminalOutput | TerminalLine[]
): Promise<void> => {
  const terminalOut = outputs instanceof TerminalOutput
    ? outputs
    : new TerminalOutput();

  const { tasks, projects, metrics, nowIso } = context;
  const type = args[0];
  const targetId = args[1];
  const period = args[2] || 'all';

  if (!type || !targetId) {
    terminalOut.error('Error: Usage: time <subtask/task/profile> <id> [today/week/month/all]');
    if (!(outputs instanceof TerminalOutput)) {
      terminalOut.mergeInto(outputs);
    }
    return;
  }

  const metricsEngine = EngineRouter.getInstance().metrics;
  let dur: number;
  let pName: string;

  if (period === 'all') {
    if (type === 'profile') {
      dur = metrics?.projects[targetId]?.totalElapsedSeconds ?? await metricsEngine.getProjectElapsed(targetId, nowIso);
      pName = projects.find(p => p.id === targetId)?.name || targetId;
    } else if (type === 'task' || type === 'subtask') {
      dur = metrics?.tasks[targetId]?.elapsedSeconds ?? await metricsEngine.getTaskElapsed(targetId, nowIso);
      pName = tasks.find(t => t.id === targetId)?.name || targetId;
    } else {
      terminalOut.error('Error: Type must be subtask, task, or profile.');
      if (!(outputs instanceof TerminalOutput)) {
        terminalOut.mergeInto(outputs);
      }
      return;
    }
  } else {
    const refDate = nowIso ? new Date(nowIso) : new Date();
    const rangeResult = getRangeFilterForPeriod(period, refDate);
    const rangeMetrics = await metricsEngine.getRangeMetrics(rangeResult.filter, nowIso);

    if (type === 'profile') {
      dur = rangeMetrics.projectElapsed[targetId] ?? 0;
      pName = projects.find(p => p.id === targetId)?.name || targetId;
    } else if (type === 'task' || type === 'subtask') {
      dur = rangeMetrics.taskElapsed[targetId] ?? 0;
      pName = tasks.find(t => t.id === targetId)?.name || targetId;
    } else {
      terminalOut.error('Error: Type must be subtask, task, or profile.');
      if (!(outputs instanceof TerminalOutput)) {
        terminalOut.mergeInto(outputs);
      }
      return;
    }
  }

  terminalOut.success(`[${period.toUpperCase()}] Time elapsed for ${type.toUpperCase()} "${pName}": ${formatSeconds(dur)}`);

  if (!(outputs instanceof TerminalOutput)) {
    terminalOut.mergeInto(outputs);
  }
};

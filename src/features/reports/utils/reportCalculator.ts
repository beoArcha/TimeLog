import { TimeLog } from '@bindings/TimeLog';
import { PatchLog } from '@bindings/PatchLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { Settings } from '@bindings/Settings';
import { calculateRangeMetrics } from '@plugins/engine/elapsed';
import { ReportStatisticsResult } from '../types';
import { getRangeFilterForPeriod } from './periodRanges';
import { calculateTopProject, buildProjectChart } from './projectDistribution';

export {
  calculateStartOfWeek,
  calculateLogDurationSeconds,
  getRangeFilterForPeriod,
} from './periodRanges';

export {
  calculateTopProject,
  buildProjectChart,
} from './projectDistribution';

/**
 * ViewModel adapter: Coordinates engine range metrics and presentation models for reports.
 * Delegates all temporal duration and segment clamping calculations exclusively to the engine.
 */
export function calculateReportStatistics({
  logs,
  patches,
  projects,
  tasks,
  nowIso,
  reportPeriod,
  reportSort,
  sysSettings,
  customFrom,
  customTo,
}: {
  logs: TimeLog[];
  patches: PatchLog[];
  projects: Project[];
  tasks: Task[];
  nowIso?: string;
  reportPeriod: string;
  reportSort: string;
  sysSettings?: Settings | null;
  customFrom?: string;
  customTo?: string;
}): ReportStatisticsResult {
  const now = nowIso ? new Date(nowIso) : new Date();
  const includePatches = !!sysSettings?.includePatchesInReports;

  // 1. Delegate baseline overview metrics (today, week, month) to engine
  const todayRange = getRangeFilterForPeriod('today', now, undefined, undefined, includePatches);
  const weekRange = getRangeFilterForPeriod('week', now, undefined, undefined, includePatches);
  const monthRange = getRangeFilterForPeriod('month', now, undefined, undefined, includePatches);

  const todayResult = calculateRangeMetrics(todayRange.filter, tasks, logs, nowIso, includePatches ? patches : []);
  const weekResult = calculateRangeMetrics(weekRange.filter, tasks, logs, nowIso, includePatches ? patches : []);
  const monthResult = calculateRangeMetrics(monthRange.filter, tasks, logs, nowIso, includePatches ? patches : []);

  const todaySec = todayResult.totalSeconds;
  const weekSec = weekResult.totalSeconds;
  const monthSec = monthResult.totalSeconds;

  // 2. Delegate active period metrics to engine
  const activeRange = getRangeFilterForPeriod(reportPeriod, now, customFrom, customTo, includePatches);
  const activeResult = calculateRangeMetrics(activeRange.filter, tasks, logs, nowIso, includePatches ? patches : []);

  const periodTotalSec = activeResult.totalSeconds;
  const daysInPeriod = activeRange.days;
  const dailyAverageSec = Math.round(periodTotalSec / daysInPeriod);

  // 3. Evaluate leading project for the active period
  const topProject = calculateTopProject(activeResult.projectElapsed, periodTotalSec, projects);

  // 4. Construct project distribution breakdown
  const { projectChart, maxSec } = buildProjectChart(
    activeResult.projectElapsed,
    activeResult.clampedLogs,
    projects,
    tasks,
    reportSort
  );

  // 5. Clamped segments list and backward-compatible filtered logs
  const clampedLogs = [...activeResult.clampedLogs];
  if (reportSort === 'date') {
    clampedLogs.sort((a, b) => new Date(a.clampedStartTime).getTime() - new Date(b.clampedStartTime).getTime());
  } else {
    clampedLogs.sort((a, b) => b.clampedDurationSeconds - a.clampedDurationSeconds);
  }

  const filteredLogs = logs.filter(log => activeResult.clampedLogs.some(cl => cl.id === log.id));

  return {
    todaySec,
    weekSec,
    monthSec,
    periodTotalSec,
    dailyAverageSec,
    topProject,
    filteredLogs,
    projectChart,
    maxSec,
    displayLogs: clampedLogs,
    clampedLogs,
  };
}

import { TimeLog } from '@bindings/TimeLog';
import { PatchLog } from '@bindings/PatchLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { Settings } from '@bindings/Settings';
import { ProjectChartItem, ReportStatisticsResult } from '../hooks/useReportStatistics';

export function calculateStartOfWeek(now: Date): number {
  const dWeek = new Date(now);
  const wDay = dWeek.getDay();
  const diffToMonday = dWeek.getDate() - wDay + (wDay === 0 ? -6 : 1);
  return new Date(dWeek.setDate(diffToMonday)).setHours(0, 0, 0, 0);
}

export function calculateReportStatistics({
  logs,
  patches,
  projects,
  tasks,
  nowIso,
  reportPeriod,
  reportSort,
  sysSettings,
}: {
  logs: TimeLog[];
  patches: PatchLog[];
  projects: Project[];
  tasks: Task[];
  nowIso: string;
  reportPeriod: string;
  reportSort: string;
  sysSettings?: Settings | null;
}): ReportStatisticsResult {
  const now = new Date(nowIso);
  const startOfToday = new Date(now).setHours(0, 0, 0, 0);
  const startOfWeek = calculateStartOfWeek(now);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const getSumSeconds = (timeLimitMs: number) => {
    let sum = logs.reduce((acc, log) => {
      const logStart = new Date(log.startTime).getTime();
      if (logStart >= timeLimitMs) {
        const logEnd = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
        return acc + Math.max(0, Math.floor((logEnd - logStart) / 1000));
      }
      return acc;
    }, 0);

    if (sysSettings?.includePatchesInReports) {
      sum += patches.reduce((acc, p) => {
        const pStart = new Date(p.startTime).getTime();
        if (pStart >= timeLimitMs) {
          const pEnd = p.endTime ? new Date(p.endTime).getTime() : new Date(nowIso).getTime();
          return acc + Math.max(0, Math.floor((pEnd - pStart) / 1000));
        }
        return acc;
      }, 0);
    }
    return sum;
  };

  const todaySec = getSumSeconds(startOfToday);
  const weekSec = getSumSeconds(startOfWeek);
  const monthSec = getSumSeconds(startOfMonth);

  let limitMs = 0;
  if (reportPeriod === 'today') {
    limitMs = startOfToday;
  } else if (reportPeriod === 'week') {
    limitMs = startOfWeek;
  } else if (reportPeriod === 'month') {
    limitMs = startOfMonth;
  }

  const filteredLogs = logs.filter(log => new Date(log.startTime).getTime() >= limitMs);
  const projectTimeData: Record<string, { seconds: number; tasks: Record<string, number> }> = {};
  const combinedLogs = sysSettings?.includePatchesInReports
    ? [...filteredLogs, ...patches.filter(p => new Date(p.startTime).getTime() >= limitMs)]
    : filteredLogs;

  combinedLogs.forEach(log => {
    const start = new Date(log.startTime).getTime();
    const end = log.endTime ? new Date(log.endTime).getTime() : new Date(nowIso).getTime();
    const duration = Math.max(0, Math.floor((end - start) / 1000));

    if (!projectTimeData[log.projectId]) {
      projectTimeData[log.projectId] = { seconds: 0, tasks: {} };
    }
    projectTimeData[log.projectId].seconds += duration;

    if (log.taskId) {
      projectTimeData[log.projectId].tasks[log.taskId] =
        (projectTimeData[log.projectId].tasks[log.taskId] || 0) + duration;
    }
  });

  const projectChart: ProjectChartItem[] = Object.entries(projectTimeData).map(([pId, data]) => {
    const p = projects.find(x => x.id === pId);
    const taskBreakdown = Object.entries(data.tasks)
      .map(([tId, sec]) => {
        return { task: tasks.find(t => t.id === tId), seconds: sec };
      })
      .filter(t => t.task)
      .sort((a, b) => b.seconds - a.seconds);
    return {
      id: pId,
      name: p?.name || `Project ${pId}`,
      color: p?.color || 'violet',
      seconds: data.seconds,
      tasks: taskBreakdown,
    };
  });

  if (reportSort === 'duration') {
    projectChart.sort((a, b) => b.seconds - a.seconds);
  } else {
    projectChart.sort((a, b) => a.name.localeCompare(b.name));
  }

  const maxSec = Math.max(...projectChart.map(x => x.seconds), 1);
  const displayLogs = [...filteredLogs];
  if (reportSort === 'date') {
    displayLogs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  } else {
    displayLogs.sort((a, b) => {
      const endA = a.endTime ? new Date(a.endTime).getTime() : new Date(nowIso).getTime();
      const endB = b.endTime ? new Date(b.endTime).getTime() : new Date(nowIso).getTime();
      return endB - new Date(b.startTime).getTime() - (endA - new Date(a.startTime).getTime());
    });
  }

  return {
    todaySec,
    weekSec,
    monthSec,
    filteredLogs,
    projectChart,
    maxSec,
    displayLogs,
  };
}

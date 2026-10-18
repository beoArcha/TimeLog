import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { ProjectChartItem, ReportTopProject } from '../types';

/**
 * Determines the project with the highest accumulated elapsed time in the period.
 */
export function calculateTopProject(
  projectElapsed: Record<string, number>,
  periodTotalSec: number,
  projects: Project[]
): ReportTopProject | null {
  if (periodTotalSec <= 0 || Object.keys(projectElapsed).length === 0) {
    return null;
  }

  let maxProjectSec = -1;
  let maxProjectId = '';
  for (const [pId, sec] of Object.entries(projectElapsed)) {
    if (sec > maxProjectSec) {
      maxProjectSec = sec;
      maxProjectId = pId;
    }
  }

  if (!maxProjectId || maxProjectSec <= 0) {
    return null;
  }

  const proj = projects.find(p => p.id === maxProjectId);
  return {
    id: maxProjectId,
    name: proj?.name || `Project ${maxProjectId}`,
    color: proj?.color || 'violet',
    seconds: maxProjectSec,
    percentage: (maxProjectSec / periodTotalSec) * 100,
  };
}

/**
 * Builds and sorts the project distribution breakdown with nested task metrics.
 */
export function buildProjectChart(
  projectElapsed: Record<string, number>,
  clampedLogs: ClampedTimeLog[],
  projects: Project[],
  tasks: Task[],
  reportSort: string
): { projectChart: ProjectChartItem[]; maxSec: number } {
  const projectChart: ProjectChartItem[] = Object.entries(projectElapsed)
    .filter(([_, sec]) => sec > 0)
    .map(([pId, sec]) => {
      const p = projects.find(x => x.id === pId);
      const taskBreakdownMap: Record<string, number> = {};
      for (const log of clampedLogs) {
        if (log.projectId === pId && log.taskId) {
          taskBreakdownMap[log.taskId] = (taskBreakdownMap[log.taskId] || 0) + log.clampedDurationSeconds;
        }
      }
      const taskBreakdown = Object.entries(taskBreakdownMap)
        .map(([tId, taskSec]) => ({
          task: tasks.find(t => t.id === tId),
          seconds: taskSec,
        }))
        .filter(t => t.task)
        .sort((a, b) => b.seconds - a.seconds);

      return {
        id: pId,
        name: p?.name || `Project ${pId}`,
        color: p?.color || 'violet',
        seconds: sec,
        tasks: taskBreakdown,
      };
    });

  if (reportSort === 'duration') {
    projectChart.sort((a, b) => b.seconds - a.seconds);
  } else {
    projectChart.sort((a, b) => a.name.localeCompare(b.name));
  }

  const maxSec = Math.max(...projectChart.map(x => x.seconds), 1);

  return { projectChart, maxSec };
}

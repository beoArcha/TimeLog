import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Project } from '@bindings/Project';
import { TaskComputedMetrics } from '@bindings/TaskComputedMetrics';
import { ProjectComputedMetrics } from '@bindings/ProjectComputedMetrics';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';

export interface ElapsedRangeFilter {
  from?: string;
  to?: string;
  taskId?: string;
  projectId?: string;
}

export { type TaskComputedMetrics, type ProjectComputedMetrics, type EngineComputedMetrics };

interface LogMetricsAggregation {
  taskSelfElapsed: Record<string, number>;
  taskIsRunning: Record<string, boolean>;
  projectTotalElapsed: Record<string, number>;
  projectTodayElapsed: Record<string, number>;
  projectWeekElapsed: Record<string, number>;
  projectIsRunning: Record<string, boolean>;
}

interface TaskHierarchyIndex {
  subtasksMap: Record<string, string[]>;
  projectTaskCounts: Record<string, { active: number; completed: number }>;
}

function aggregateLogMetrics(
  logs: TimeLog[],
  nowMs: number,
  todayStartMs: number,
  weekStartMs: number
): LogMetricsAggregation {
  const taskSelfElapsed: Record<string, number> = {};
  const taskIsRunning: Record<string, boolean> = {};
  const projectTotalElapsed: Record<string, number> = {};
  const projectTodayElapsed: Record<string, number> = {};
  const projectWeekElapsed: Record<string, number> = {};
  const projectIsRunning: Record<string, boolean> = {};

  for (const log of logs) {
    const startMs = Date.parse(log.startTime);
    const isActive = log.endTime === null || log.endTime === undefined;
    const endMs = isActive ? nowMs : Date.parse(log.endTime!);

    if (endMs >= startMs) {
      const diffSecs = Math.max(0, Math.floor((endMs - startMs) / 1000));
      taskSelfElapsed[log.taskId] = (taskSelfElapsed[log.taskId] || 0) + diffSecs;
      projectTotalElapsed[log.projectId] = (projectTotalElapsed[log.projectId] || 0) + diffSecs;

      if (isActive) {
        taskIsRunning[log.taskId] = true;
        projectIsRunning[log.projectId] = true;
      }

      const todayOverlapStart = Math.max(startMs, todayStartMs);
      const todayOverlapEnd = Math.min(endMs, nowMs);
      if (todayOverlapEnd >= todayOverlapStart) {
        const todaySecs = Math.max(0, Math.floor((todayOverlapEnd - todayOverlapStart) / 1000));
        projectTodayElapsed[log.projectId] = (projectTodayElapsed[log.projectId] || 0) + todaySecs;
      }

      const weekOverlapStart = Math.max(startMs, weekStartMs);
      const weekOverlapEnd = Math.min(endMs, nowMs);
      if (weekOverlapEnd >= weekOverlapStart) {
        const weekSecs = Math.max(0, Math.floor((weekOverlapEnd - weekOverlapStart) / 1000));
        projectWeekElapsed[log.projectId] = (projectWeekElapsed[log.projectId] || 0) + weekSecs;
      }
    }
  }

  return {
    taskSelfElapsed,
    taskIsRunning,
    projectTotalElapsed,
    projectTodayElapsed,
    projectWeekElapsed,
    projectIsRunning,
  };
}

function indexTaskHierarchy(tasks: Task[]): TaskHierarchyIndex {
  const subtasksMap: Record<string, string[]> = {};
  const projectTaskCounts: Record<string, { active: number; completed: number }> = {};

  for (const task of tasks) {
    if (!projectTaskCounts[task.projectId]) {
      projectTaskCounts[task.projectId] = { active: 0, completed: 0 };
    }
    if (task.completed) {
      projectTaskCounts[task.projectId].completed += 1;
    } else {
      projectTaskCounts[task.projectId].active += 1;
    }

    if (task.parentTaskId) {
      if (!subtasksMap[task.parentTaskId]) {
        subtasksMap[task.parentTaskId] = [];
      }
      subtasksMap[task.parentTaskId].push(task.id);
    }
  }

  return { subtasksMap, projectTaskCounts };
}

function buildTaskComputedMetrics(
  tasks: Task[],
  taskSelfElapsed: Record<string, number>,
  taskIsRunning: Record<string, boolean>,
  subtasksMap: Record<string, string[]>
): Record<string, TaskComputedMetrics> {
  const computedTasks: Record<string, TaskComputedMetrics> = {};
  for (const task of tasks) {
    const selfElapsed = taskSelfElapsed[task.id] || 0;
    const isRunning = !!taskIsRunning[task.id];

    const subtaskIds = subtasksMap[task.id] || [];
    let subtaskElapsed = 0;
    let hasRunningChild = false;

    for (const subId of subtaskIds) {
      subtaskElapsed += taskSelfElapsed[subId] || 0;
      if (taskIsRunning[subId]) {
        hasRunningChild = true;
      }
    }

    computedTasks[task.id] = {
      taskId: task.id,
      elapsedSeconds: selfElapsed + subtaskElapsed,
      selfElapsedSeconds: selfElapsed,
      isRunning,
      hasRunningChild,
    };
  }
  return computedTasks;
}

function buildProjectComputedMetrics(
  projects: Project[],
  projectTotalElapsed: Record<string, number>,
  projectTodayElapsed: Record<string, number>,
  projectWeekElapsed: Record<string, number>,
  projectIsRunning: Record<string, boolean>,
  projectTaskCounts: Record<string, { active: number; completed: number }>
): Record<string, ProjectComputedMetrics> {
  const computedProjects: Record<string, ProjectComputedMetrics> = {};
  for (const project of projects) {
    const totalElapsed = projectTotalElapsed[project.id] || 0;
    const todayElapsed = projectTodayElapsed[project.id] || 0;
    const thisWeekElapsed = projectWeekElapsed[project.id] || 0;
    const isRunning = !!projectIsRunning[project.id];
    const counts = projectTaskCounts[project.id] || { active: 0, completed: 0 };

    computedProjects[project.id] = {
      projectId: project.id,
      totalElapsedSeconds: totalElapsed,
      todayElapsedSeconds: todayElapsed,
      thisWeekElapsedSeconds: thisWeekElapsed,
      activeTaskCount: counts.active,
      completedTaskCount: counts.completed,
      isRunning,
    };
  }
  return computedProjects;
}

/**
 * Pure calculation: Single-pass O(N) evaluation of all task and project metrics
 * using a single unified snapshot timestamp.
 */
export function computeAllMetrics(
  tasks: Task[],
  logs: TimeLog[],
  projects: Project[],
  nowIso?: string
): EngineComputedMetrics {
  const snapshotNow = nowIso ? new Date(nowIso) : new Date();
  const snapshotNowIso = snapshotNow.toISOString();
  const nowMs = snapshotNow.getTime();

  const todayStart = new Date(snapshotNow);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();

  const weekStart = new Date(todayStart);
  const day = weekStart.getUTCDay();
  const diffToMonday = (day + 6) % 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - diffToMonday);
  const weekStartMs = weekStart.getTime();

  const logMetrics = aggregateLogMetrics(logs, nowMs, todayStartMs, weekStartMs);
  const hierarchy = indexTaskHierarchy(tasks);

  const tasksMetrics = buildTaskComputedMetrics(
    tasks,
    logMetrics.taskSelfElapsed,
    logMetrics.taskIsRunning,
    hierarchy.subtasksMap
  );

  const projectsMetrics = buildProjectComputedMetrics(
    projects,
    logMetrics.projectTotalElapsed,
    logMetrics.projectTodayElapsed,
    logMetrics.projectWeekElapsed,
    logMetrics.projectIsRunning,
    hierarchy.projectTaskCounts
  );

  return {
    snapshotNowIso,
    tasks: tasksMetrics,
    projects: projectsMetrics,
  };
}

/**
 * Pure calculation: Calculates total elapsed seconds for a task and its subtasks.
 * Internal to EnginePlugin (Browser runtime). Does NOT mutate state.
 */
export function calculateTaskElapsed(
  taskId: string,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): number {
  const currentNow = nowIso ? new Date(nowIso).getTime() : Date.now();
  let totalSeconds = 0;

  const taskLogs = logs.filter(log => log.taskId === taskId);
  for (const log of taskLogs) {
    const start = new Date(log.startTime).getTime();
    const end = log.endTime ? new Date(log.endTime).getTime() : currentNow;
    if (end >= start) {
      totalSeconds += Math.max(0, Math.floor((end - start) / 1000));
    }
  }

  const childTasks = tasks.filter(t => t.parentTaskId === taskId);
  for (const child of childTasks) {
    totalSeconds += calculateTaskElapsed(child.id, tasks, logs, nowIso);
  }

  return totalSeconds;
}

/**
 * Pure calculation: Calculates total elapsed seconds for all root tasks in a project.
 * Internal to EnginePlugin (Browser runtime). Does NOT mutate state.
 */
export function calculateProjectElapsed(
  projectId: string,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): number {
  const rootTasks = tasks.filter(t => t.projectId === projectId && !t.parentTaskId);
  let totalSeconds = 0;
  for (const task of rootTasks) {
    totalSeconds += calculateTaskElapsed(task.id, tasks, logs, nowIso);
  }
  return totalSeconds;
}

/**
 * Pure calculation: Calculates total elapsed seconds within a time range [from, to]
 * optionally filtered by taskId or projectId.
 * Internal to EnginePlugin (Browser runtime). Does NOT mutate state.
 */
export function calculateElapsedRange(
  range: ElapsedRangeFilter,
  tasks: Task[],
  logs: TimeLog[],
  nowIso?: string
): number {
  const currentNow = nowIso ? new Date(nowIso).getTime() : Date.now();
  const rangeStart = range.from ? new Date(range.from).getTime() : -Infinity;
  const rangeEnd = range.to ? new Date(range.to).getTime() : Infinity;

  let relevantTaskIds: Set<string> | null = null;

  if (range.taskId) {
    relevantTaskIds = new Set<string>([range.taskId]);
    const collectSubtasks = (parent: string) => {
      for (const t of tasks) {
        if (t.parentTaskId === parent && !relevantTaskIds?.has(t.id)) {
          relevantTaskIds?.add(t.id);
          collectSubtasks(t.id);
        }
      }
    };
    collectSubtasks(range.taskId);
  } else if (range.projectId) {
    relevantTaskIds = new Set<string>(
      tasks.filter(t => t.projectId === range.projectId).map(t => t.id)
    );
  }

  let totalSeconds = 0;

  for (const log of logs) {
    if (relevantTaskIds && !relevantTaskIds.has(log.taskId)) {
      continue;
    }

    const logStart = new Date(log.startTime).getTime();
    const logEnd = log.endTime ? new Date(log.endTime).getTime() : currentNow;

    const overlapStart = Math.max(logStart, rangeStart);
    const overlapEnd = Math.min(logEnd, rangeEnd);

    if (overlapEnd >= overlapStart) {
      totalSeconds += Math.max(0, Math.floor((overlapEnd - overlapStart) / 1000));
    }
  }

  return totalSeconds;
}

import { TimeLog } from '@bindings/TimeLog';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';

export interface GroupedSubtask<TLog = ClampedTimeLog | TimeLog> {
  subtask: Task;
  durationSeconds: number;
  logs: TLog[];
}

export interface GroupedTask<TLog = ClampedTimeLog | TimeLog> {
  task: Task;
  durationSeconds: number;
  directLogs: TLog[];
  subtasks: GroupedSubtask<TLog>[];
}

export interface GroupedProject<TLog = ClampedTimeLog | TimeLog> {
  projectId: string;
  projectName: string;
  projectColor?: string;
  project?: Project;
  tags: string[];
  durationSeconds: number;
  tasks: GroupedTask<TLog>[];
}

export interface GroupedHierarchy<TLog = ClampedTimeLog | TimeLog> {
  projects: GroupedProject<TLog>[];
  totalDurationSeconds: number;
  totalLogsCount: number;
}

export interface GroupTimeLogsOptions<TLog = ClampedTimeLog | TimeLog> {
  logs: TLog[];
  projects: Project[];
  tasks: Task[];
  nowIso?: string;
}

/**
 * Calculates duration in seconds for a single time log or clamped time log.
 */
export function getLogDurationSeconds(
  log: ClampedTimeLog | TimeLog,
  nowIso?: string
): number {
  if ('clampedDurationSeconds' in log && typeof log.clampedDurationSeconds === 'number') {
    return Math.max(0, log.clampedDurationSeconds);
  }
  const start = new Date(log.startTime).getTime();
  if (Number.isNaN(start)) {
    return 0;
  }
  const fallbackEnd = nowIso ? new Date(nowIso).getTime() : start;
  const end = log.endTime ? new Date(log.endTime).getTime() : fallbackEnd;
  if (Number.isNaN(end)) {
    return 0;
  }
  return Math.max(0, Math.floor((end - start) / 1000));
}

/**
 * Groups time logs into a strict 3-tier hierarchy:
 * Project -> Task -> Subtask (with direct logs on task when no subtask).
 *
 * Guarantees:
 * 1. Project durationSeconds strictly equals sum of task durationSeconds.
 * 2. Task durationSeconds strictly equals sum of directLogs durationSeconds + subtasks durationSeconds.
 * 3. Total hierarchy durationSeconds strictly equals sum of all project durationSeconds.
 * 4. Total hierarchy logsCount strictly equals logs.length.
 */
export function groupTimeLogs<TLog extends ClampedTimeLog | TimeLog = ClampedTimeLog | TimeLog>({
  logs,
  projects,
  tasks,
  nowIso,
}: GroupTimeLogsOptions<TLog>): GroupedHierarchy<TLog> {
  if (!logs || logs.length === 0) {
    return {
      projects: [],
      totalDurationSeconds: 0,
      totalLogsCount: 0,
    };
  }

  const projectMap = new Map<string, Project>(projects.map((p) => [p.id, p]));
  const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));

  const projectOrder: string[] = [];
  const projectGroupMap = new Map<string, {
    projectId: string;
    projectName: string;
    projectColor?: string;
    project?: Project;
    tags: string[];
    durationSeconds: number;
    taskOrder: string[];
    taskMap: Map<string, {
      task: Task;
      durationSeconds: number;
      directLogs: TLog[];
      subtaskOrder: string[];
      subtaskMap: Map<string, {
        subtask: Task;
        durationSeconds: number;
        logs: TLog[];
      }>;
    }>;
  }>();

  for (const log of logs) {
    const durSec = getLogDurationSeconds(log, nowIso);
    const rawTask = taskMap.get(log.taskId);

    let rootTask: Task;
    let subtask: Task | undefined;

    if (rawTask?.parentTaskId) {
      subtask = rawTask;
      const parentTask = taskMap.get(rawTask.parentTaskId);
      rootTask = parentTask ?? {
        id: rawTask.parentTaskId,
        name: rawTask.parentTaskId,
        projectId: rawTask.projectId || log.projectId || 'unknown',
        completed: false,
        createdAt: '',
      };
    } else {
      rootTask = rawTask ?? {
        id: log.taskId || 'unknown-task',
        name: rawTask?.name || 'Unknown',
        projectId: log.projectId || 'unknown',
        completed: false,
        createdAt: '',
      };
    }

    const resolvedProjectId =
      (log as ClampedTimeLog).projectId ||
      log.projectId ||
      rootTask.projectId ||
      'unknown-project';

    let projGroup = projectGroupMap.get(resolvedProjectId);
    if (!projGroup) {
      const projObj = projectMap.get(resolvedProjectId);
      projGroup = {
        projectId: resolvedProjectId,
        projectName: projObj?.name || 'Unknown',
        projectColor: projObj?.color,
        project: projObj,
        tags: Array.isArray(projObj?.tags) ? projObj.tags : [],
        durationSeconds: 0,
        taskOrder: [],
        taskMap: new Map(),
      };
      projectGroupMap.set(resolvedProjectId, projGroup);
      projectOrder.push(resolvedProjectId);
    }

    projGroup.durationSeconds += durSec;

    let tGroup = projGroup.taskMap.get(rootTask.id);
    if (!tGroup) {
      tGroup = {
        task: rootTask,
        durationSeconds: 0,
        directLogs: [],
        subtaskOrder: [],
        subtaskMap: new Map(),
      };
      projGroup.taskMap.set(rootTask.id, tGroup);
      projGroup.taskOrder.push(rootTask.id);
    }

    tGroup.durationSeconds += durSec;

    if (subtask) {
      let stGroup = tGroup.subtaskMap.get(subtask.id);
      if (!stGroup) {
        stGroup = {
          subtask,
          durationSeconds: 0,
          logs: [],
        };
        tGroup.subtaskMap.set(subtask.id, stGroup);
        tGroup.subtaskOrder.push(subtask.id);
      }
      stGroup.durationSeconds += durSec;
      stGroup.logs.push(log);
    } else {
      tGroup.directLogs.push(log);
    }
  }

  let totalDurationSeconds = 0;
  let totalLogsCount = 0;

  const resultProjects: GroupedProject<TLog>[] = projectOrder.map((projId) => {
    const pGroup = projectGroupMap.get(projId)!;
    totalDurationSeconds += pGroup.durationSeconds;

    const resultTasks: GroupedTask<TLog>[] = pGroup.taskOrder.map((taskId) => {
      const tGroup = pGroup.taskMap.get(taskId)!;
      totalLogsCount += tGroup.directLogs.length;

      const resultSubtasks: GroupedSubtask<TLog>[] = tGroup.subtaskOrder.map((stId) => {
        const stGroup = tGroup.subtaskMap.get(stId)!;
        totalLogsCount += stGroup.logs.length;
        return {
          subtask: stGroup.subtask,
          durationSeconds: stGroup.durationSeconds,
          logs: stGroup.logs,
        };
      });

      return {
        task: tGroup.task,
        durationSeconds: tGroup.durationSeconds,
        directLogs: tGroup.directLogs,
        subtasks: resultSubtasks,
      };
    });

    return {
      projectId: pGroup.projectId,
      projectName: pGroup.projectName,
      projectColor: pGroup.projectColor,
      project: pGroup.project,
      tags: pGroup.tags,
      durationSeconds: pGroup.durationSeconds,
      tasks: resultTasks,
    };
  });

  return {
    projects: resultProjects,
    totalDurationSeconds,
    totalLogsCount,
  };
}

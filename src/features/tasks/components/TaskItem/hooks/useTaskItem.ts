import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Locale } from '@bindings/Locale';
import { getTaskDurationSeconds } from '@/src/features/timelogs/utils/TimelogUtils';

interface UseTaskItemParams {
  rootTask: Task;
  tasks: Task[];
  logs: TimeLog[];
  nowIso?: string;
  metrics?: import('@bindings/EngineComputedMetrics').EngineComputedMetrics | null;
  projectTasks: Task[];
  locale?: Locale;
}

interface UseTaskItemResult {
  subTasks: Task[];
  rootDuration: number;
  runningSubtask: Task | undefined;
  isCurrentRunning: boolean;
  isChildRunning: boolean;
  isAnyRunning: boolean;
}

export function useTaskItem({
  rootTask,
  tasks,
  logs,
  nowIso,
  metrics,
  projectTasks,
}: UseTaskItemParams): UseTaskItemResult {
  const subTasks = projectTasks.filter((t: Task) => t.parentTaskId === rootTask.id);

  const taskMetric = metrics?.tasks?.[rootTask.id];
  const rootDuration = taskMetric
    ? taskMetric.elapsedSeconds
    : (nowIso ? getTaskDurationSeconds(rootTask.id, tasks, logs, nowIso) : 0);

  const isCurrentRunning = taskMetric
    ? taskMetric.isRunning
    : logs.some((l: TimeLog) => l.taskId === rootTask.id && l.endTime === null);

  const runningSubtask = subTasks.find((sub: Task) => {
    const subMetric = metrics?.tasks?.[sub.id];
    if (subMetric !== undefined) return subMetric.isRunning;
    return logs.some((l: TimeLog) => l.taskId === sub.id && l.endTime === null);
  });

  const isChildRunning = taskMetric ? taskMetric.hasRunningChild : !!runningSubtask;
  const isAnyRunning = isCurrentRunning || isChildRunning;

  return {
    subTasks,
    rootDuration,
    runningSubtask,
    isCurrentRunning,
    isChildRunning,
    isAnyRunning,
  };
}


import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Locale } from '@bindings/Locale';
import { useLiveTaskElapsed } from '@common/hooks/useLiveTaskElapsed';

interface UseTaskItemParams {
  rootTask: Task;
  tasks: Task[];
  logs: TimeLog[];
  nowIso?: string;
  metrics?: import('@bindings/EngineComputedMetrics').EngineComputedMetrics | null;
  activeLog?: TimeLog | null;
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
  logs,  
  metrics,
  activeLog,
  projectTasks,
}: UseTaskItemParams): UseTaskItemResult {
  const subTasks = projectTasks.filter((t: Task) => t.parentTaskId === rootTask.id);
  const taskMetric = metrics?.tasks?.[rootTask.id];

  const runningSubtask = subTasks.find((sub: Task) => {
    const subMetric = metrics?.tasks?.[sub.id];
    if (subMetric !== undefined) return subMetric.isRunning;
    return (
      (activeLog && activeLog.taskId === sub.id) ||
      logs.some((l: TimeLog) => l.taskId === sub.id && l.endTime === null)
    );
  });

  const isChildRunning = taskMetric ? taskMetric.hasRunningChild : !!runningSubtask;

  const { elapsedSeconds: rootDuration, isSelfRunning: isCurrentRunning } = useLiveTaskElapsed(rootTask.id, {
    metrics,
    activeLog,
    includeChildren: true,
    isChildRunning,
  });

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


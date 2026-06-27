import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Locale } from '@bindings/Locale';
import { getTaskDurationSeconds } from '@/src/features/timelogs/utils/TimelogUtils';

interface UseTaskItemParams {
  rootTask: Task;
  tasks: Task[];
  logs: TimeLog[];
  nowIso: string;
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
  projectTasks,
}: UseTaskItemParams): UseTaskItemResult {
  const subTasks = projectTasks.filter((t: Task) => t.parentTaskId === rootTask.id);
  const rootDuration = getTaskDurationSeconds(rootTask.id, tasks, logs, nowIso);

  const isCurrentRunning = logs.some(
    (l: TimeLog) => l.taskId === rootTask.id && l.endTime === null,
  );
  const runningSubtask = subTasks.find((sub: Task) =>
    logs.some((l: TimeLog) => l.taskId === sub.id && l.endTime === null),
  );
  const isChildRunning = !!runningSubtask;
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

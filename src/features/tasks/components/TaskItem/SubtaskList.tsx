import { Task } from '@bindings/Task';
import { SubtaskItem } from './SubtaskItem';

export interface SubtaskListProps {
  subTasks: Task[];
  isCondensed: boolean;
  metrics?: import('@bindings/EngineComputedMetrics').EngineComputedMetrics | null;
  onToggleTaskComplete?: (id: string) => void;
  onRenameTask?: ((id: string, name: string) => void) | undefined;
  onUpdateTask?: ((
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: import('@bindings/TaskStatus').TaskStatus | null,
    completed: boolean | null
  ) => void) | undefined;
  onDeleteTask?: ((id: string) => void) | undefined;
  onStartTimer?: (id: string) => void;
  onStopTimer?: (projectId?: string) => void;
}

export function SubtaskList({
  subTasks,
  isCondensed,
  metrics,
  onToggleTaskComplete,
  onRenameTask,
  onUpdateTask,
  onDeleteTask,
  onStartTimer,
  onStopTimer,
}: SubtaskListProps) {
  if (subTasks.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-2 ml-8 border-l pl-4 mt-2 overflow-y-auto pr-1 ${
        isCondensed ? 'max-h-[250px]' : ''
      } border-border`}
    >
      {subTasks.map((subTask: Task) => (
        <SubtaskItem
          key={subTask.id}
          subTask={subTask}
          metrics={metrics}
          onToggleTaskComplete={onToggleTaskComplete}
          onRenameTask={onRenameTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onStartTimer={onStartTimer}
          onStopTimer={onStopTimer}
        />
      ))}
    </div>
  );
}

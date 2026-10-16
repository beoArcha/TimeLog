import { Task } from '@bindings/Task';
import { SubtaskItem } from './SubtaskItem';

export interface SubtaskListProps {
  subTasks: Task[];
  isCondensed: boolean;
  metrics?: import('@bindings/EngineComputedMetrics').EngineComputedMetrics | null;
}

export function SubtaskList({
  subTasks,
  isCondensed,
  metrics,
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
        />
      ))}
    </div>
  );
}

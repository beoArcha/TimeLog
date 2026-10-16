import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { TaskStatus } from '@bindings/TaskStatus';
import { SubtaskItem } from './SubtaskItem';

interface SubtaskListProps {
  subTasks: Task[];
  tasks: Task[];
  logs: TimeLog[];
  nowIso?: string;
  metrics?: import('@bindings/EngineComputedMetrics').EngineComputedMetrics | null;
  isCondensed: boolean;
  editingId: string | null;
  editName: string;
  onToggleTaskComplete: (id: string) => void;
  onRenameTask: ((id: string, name: string) => void) | undefined;
  onUpdateTask: ((
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ) => void) | undefined;
  onDeleteTask: ((id: string) => void) | undefined;
  onStartTimer: (id: string) => void;
  onStopTimer?: (projectId?: string) => void;
  setEditingId: (id: string | null) => void;
  setEditName: (name: string) => void;
}

export function SubtaskList({
  subTasks,
  tasks,
  logs,
  nowIso,
  metrics,
  isCondensed,
  editingId,
  editName,
  onToggleTaskComplete,
  onRenameTask,
  onUpdateTask,
  onDeleteTask,
  onStartTimer,
  onStopTimer,
  setEditingId,
  setEditName,
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
          tasks={tasks}
          logs={logs}
          nowIso={nowIso}
          metrics={metrics}
          editingId={editingId}
          editName={editName}
          onToggleTaskComplete={onToggleTaskComplete}
          onRenameTask={onRenameTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onStartTimer={onStartTimer}
          onStopTimer={onStopTimer}
          setEditingId={setEditingId}
          setEditName={setEditName}
        />
      ))}
    </div>
  );
}

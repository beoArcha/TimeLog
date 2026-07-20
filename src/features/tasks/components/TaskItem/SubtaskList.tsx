import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { TaskStatus } from '@bindings/TaskStatus';
import { SubtaskItem } from './SubtaskItem';

interface SubtaskListProps {
  subTasks: Task[];
  tasks: Task[];
  logs: TimeLog[];
  nowIso: string;
  isCondensed: boolean;
  editingId: string | null;
  editName: string;
  theme: string;
  th: any;
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
  setEditingId: (id: string | null) => void;
  setEditName: (name: string) => void;
}

export function SubtaskList({
  subTasks,
  tasks,
  logs,
  nowIso,
  isCondensed,
  editingId,
  editName,
  theme,
  th,
  onToggleTaskComplete,
  onRenameTask,
  onUpdateTask,
  onDeleteTask,
  onStartTimer,
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
      } ${theme === 'light' ? 'border-[#DFD7CB]' : 'border-white/10'}`}
    >
      {subTasks.map((subTask: Task) => (
        <SubtaskItem
          key={subTask.id}
          subTask={subTask}
          tasks={tasks}
          logs={logs}
          nowIso={nowIso}
          editingId={editingId}
          editName={editName}
          theme={theme}
          th={th}
          onToggleTaskComplete={onToggleTaskComplete}
          onRenameTask={onRenameTask}
          onUpdateTask={onUpdateTask}
          onDeleteTask={onDeleteTask}
          onStartTimer={onStartTimer}
          setEditingId={setEditingId}
          setEditName={setEditName}
        />
      ))}
    </div>
  );
}

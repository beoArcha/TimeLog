import { Task } from '@bindings/Task';
import { Locale } from '@bindings/Locale';
import { CheckSquare, Square as EmptySquare } from 'lucide-react';
import { translate } from '@common/i18n/translator';
import { TaskNameEditor } from './TaskNameEditor';
import { TaskActions } from './TaskActions';

interface TaskHeaderProps {
  rootTask: Task;
  isCurrentRunning: boolean;
  isChildRunning: boolean;
  runningSubtask: Task | undefined;
  editingId: string | null;
  editName: string;
  theme: string;
  locale: Locale;
  customTranslations: any;
  th: any;
  onToggleTaskComplete: (id: string) => void;
  onRenameTask: ((id: string, name: string) => void) | undefined;
  onUpdateTask: ((
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: import('@bindings/TaskStatus').TaskStatus | null,
    completed: boolean | null
  ) => void) | undefined;
  onDeleteTask: ((id: string) => void) | undefined;
  setEditingId: (id: string | null) => void;
  setEditName: (name: string) => void;
}

export function TaskHeader({
  rootTask,
  isCurrentRunning,
  isChildRunning,
  runningSubtask,
  editingId,
  editName,
  theme,
  locale,
  customTranslations,
  th,
  onToggleTaskComplete,
  onRenameTask,
  onUpdateTask,
  onDeleteTask,
  setEditingId,
  setEditName,
}: TaskHeaderProps) {
  const isEditing = editingId === rootTask.id;

  return (
    <div className={`flex items-start sm:items-center gap-section flex-1 min-w-0 w-full`}>
      <button
        id={`check-task-${rootTask.id}`}
        role="checkbox"
        aria-checked={rootTask.completed}
        onClick={() => onToggleTaskComplete(rootTask.id)}
        className={`${th.textMuted} hover:text-orange-500 transition-colors cursor-pointer shrink-0 mt-0.5 sm:mt-0`}
      >
        {rootTask.completed ? (
          <CheckSquare className={`icon-medium text-orange-500 fill-orange-500/10`} />
        ) : (
          <EmptySquare className={`icon-medium`} />
        )}
      </button>

      <div className="min-w-0 flex-1 flex items-center justify-between group/taskedit">
        {isEditing ? (
          <TaskNameEditor
            taskId={rootTask.id}
            taskName={rootTask.name}
            editName={editName}
            isEditing={isEditing}
            theme={theme}
            textSizeClass={`font-semibold text-main`}
            locale={locale}
            customTranslations={customTranslations}
            onRenameTask={onRenameTask}
            setEditName={setEditName}
            setEditingId={setEditingId}
          />
        ) : (
          <span
            className={`font-semibold text-title flex flex-wrap items-center gap-2 transition-all duration-300 min-w-0 w-full ${rootTask.completed
                ? 'line-through text-[#9B8C83] font-normal'
                : theme === 'light'
                  ? 'text-[#2C2421]'
                  : 'text-slate-100'
              }`}
          >
            <span className="truncate block max-w-full" title={rootTask.name}>
              {rootTask.name}
            </span>
            <select
              value={rootTask.status || 'Todo'}
              onChange={(e) => {
                const newStatus = e.target.value as any;
                if (onUpdateTask) {
                  onUpdateTask(rootTask.id, rootTask.name, rootTask.parentTaskId || null, newStatus, null);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className={`text-[10px] font-bold px-2 py-0.5 rounded border outline-none cursor-pointer font-mono shrink-0 transition-all ${rootTask.status === 'Done'
                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15'
                  : rootTask.status === 'InProgress'
                    ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/15'
                    : rootTask.status === 'Blocked'
                      ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/15'
                      : 'bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/15'
                }`}
            >
              <option value="Todo" className="bg-[#1b1c21] text-slate-200">TODO</option>
              <option value="InProgress" className="bg-[#1b1c21] text-blue-400">In Progress</option>
              <option value="Done" className="bg-[#1b1c21] text-emerald-400">Done</option>
              <option value="Blocked" className="bg-[#1b1c21] text-rose-450">Blocked</option>
            </select>
            {isChildRunning && runningSubtask && (
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-amber-550/15 border border-amber-500/35 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                <span className="truncate max-w-[120px]" title={runningSubtask.name}>
                  {translate(locale, 'task', 'SubtaskLabel', customTranslations)}: {runningSubtask.name}
                </span>
              </span>
            )}
            {isCurrentRunning && (
              <span className="inline-flex items-center gap-1.5 text-[10px] bg-emerald-500/15 border border-emerald-500/35 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-mono font-bold animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                {translate(locale, 'task', 'InProgressLabel', customTranslations)}
              </span>
            )}
          </span>
        )}

        <span
          className={`text-[10px] font-mono block mt-0.5 whitespace-normal leading-tight ${theme === 'light' ? 'text-[#8A7A71]' : 'text-[#9B8C83]'
            }`}
        >
          ID: {rootTask.id} • SQLite table entry {isCurrentRunning || isChildRunning ? '(Sygnał liczenia aktywny)' : ''}
        </span>

        {!isEditing && (
          <TaskActions
            taskId={rootTask.id}
            taskName={rootTask.name}
            locale={locale}
            customTranslations={customTranslations}
            deleteTitle="Usuń zadanie"
            pencilSize="w-3.5 h-3.5"
            trashSize="w-3.5 h-3.5"
            onDeleteTask={onDeleteTask}
            setEditingId={setEditingId}
            setEditName={setEditName}
          />
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { TimeLog } from '@bindings/TimeLog';
import { CheckSquare, Square as EmptySquare, Play, Square } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { getTaskDurationSeconds, formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { TaskNameEditor } from './TaskNameEditor';
import { TaskActions } from './TaskActions';

interface SubtaskItemProps {
  key?: React.Key;
  subTask: Task;
  tasks: Task[];
  logs: TimeLog[];
  nowIso: string;
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

export function SubtaskItem({
  subTask,
  tasks,
  logs,
  nowIso,
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
}: SubtaskItemProps) {
  const { t: tCommon } = useTranslation('common');
  const { t: tTimer } = useTranslation('timer');

  const subDuration = getTaskDurationSeconds(subTask.id, tasks, logs, nowIso);
  const isSubRunning = logs.some((l: TimeLog) => l.taskId === subTask.id && l.endTime === null);
  const isEditing = editingId === subTask.id;

  return (
    <div
      id={`subtask-item-${subTask.id}`}
      className={`flex items-center justify-between gap-4 py-2 px-3 rounded-xl group/sub transition-all ${isSubRunning
        ? 'bg-orange-500/10 border border-orange-500/20'
        : theme === 'light'
          ? 'hover:bg-[#EAE4DB]/80 border border-transparent text-[#2C2421]'
          : 'hover:bg-[#FCFAF8]/5 border border-transparent'
        }`}
    >
      <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
        <button
          id={`check-subtask-${subTask.id}`}
          role="checkbox"
          aria-checked={subTask.completed}
          onClick={() => onToggleTaskComplete(subTask.id)}
          aria-label={`${subTask.completed ? tCommon('Edit') : tCommon('Confirm')} ${subTask.name}`}
          className={`${th.textMuted} hover:text-orange-500 transition-colors cursor-pointer mt-0.5 sm:mt-0 shrink-0`}
        >
          {subTask.completed ? (
            <CheckSquare className="w-4 h-4 text-orange-500 fill-orange-500/10" />
          ) : (
            <EmptySquare className="w-4 h-4" />
          )}
        </button>

        <div className="min-w-0 flex-1 flex items-center justify-between group/taskedit">
          {isEditing ? (
            <TaskNameEditor
              taskId={subTask.id}
              taskName={subTask.name}
              editName={editName}
              isEditing={isEditing}
              theme={theme}
              textSizeClass="font-semibold text-xs"
              onRenameTask={onRenameTask}
              setEditName={setEditName}
              setEditingId={setEditingId}
            />
          ) : (
            <span
              className={`text-xs font-semibold flex flex-wrap items-center gap-2 transition-all duration-300 min-w-0 w-full ${subTask.completed
                ? 'line-through text-[#9B8C83] font-normal'
                : theme === 'light'
                  ? 'text-[#2C2421]'
                  : 'text-slate-200'
                }`}
            >
              <span className="truncate block max-w-full" title={subTask.name}>
                {subTask.name}
              </span>
              <select
                value={subTask.status || 'Todo'}
                onChange={(e) => {
                  const newStatus = e.target.value as TaskStatus;
                  if (onUpdateTask) {
                    onUpdateTask(subTask.id, subTask.name, subTask.parentTaskId || null, newStatus, null);
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border outline-none cursor-pointer font-mono shrink-0 transition-all ${subTask.status === 'Done'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15'
                    : subTask.status === 'InProgress'
                      ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/15'
                      : subTask.status === 'Blocked'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/15'
                        : 'bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/15'
                  }`}
              >
                <option value="Todo" className="bg-[#1b1c21] text-slate-200 text-xs">TODO</option>
                <option value="InProgress" className="bg-[#1b1c21] text-blue-400 text-xs">In Progress</option>
                <option value="Done" className="bg-[#1b1c21] text-emerald-400 text-xs">Done</option>
                <option value="Blocked" className="bg-[#1b1c21] text-rose-450 text-xs">Blocked</option>
              </select>
              {isSubRunning && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              )}
            </span>
          )}

          {!isEditing && (
            <TaskActions
              taskId={subTask.id}
              taskName={subTask.name}
              deleteTitle="Usuń podzadanie"
              pencilSize="w-3 h-3"
              trashSize="w-3 h-3"
              onDeleteTask={onDeleteTask}
              setEditingId={setEditingId}
              setEditName={setEditName}
            />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`font-mono text-[10px] px-2 py-1 rounded-md border transition-all ${isSubRunning
            ? 'bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-300 font-bold'
            : theme === 'light'
              ? 'bg-[#EAE4DB] border-[#DFD7CB] text-[#7A6A61]'
              : 'bg-[#FCFAF8]/5 border-white/10 text-slate-300'
            }`}
        >
          {formatSeconds(subDuration)}
        </span>

        {isSubRunning ? (
          <button
            id={`stop-subtask-btn-${subTask.id}`}
            onClick={() => onStartTimer(subTask.id)}
            title={tTimer('StopMeasurement')}
            aria-label={tTimer('StopMeasurement')}
            className="bg-rose-500 text-white rounded-lg p-2 transition-colors cursor-pointer animate-pulse shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-white text-white" />
          </button>
        ) : (
          <button
            id={`start-subtask-btn-${subTask.id}`}
            onClick={() => !subTask.completed && onStartTimer(subTask.id)}
            disabled={subTask.completed}
            title={tTimer('StartMeasurement')}
            aria-label={tTimer('StartMeasurement')}
            className={`text-[#9B8C83] hover:text-white rounded-lg p-2 transition-all cursor-pointer shrink-0 ${theme === 'light'
              ? 'bg-[#EAE4DB] hover:bg-teal-500 group-hover/sub:bg-teal-500 text-[#5A4A42]'
              : 'bg-[#FCFAF8]/5 hover:bg-teal-500 group-hover/sub:bg-teal-500'
              }`}
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
          </button>
        )}
      </div>
    </div>
  );
}

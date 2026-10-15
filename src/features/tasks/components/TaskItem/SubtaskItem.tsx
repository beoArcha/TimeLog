import React from 'react';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { TimeLog } from '@bindings/TimeLog';
import { CheckSquare, Square as EmptySquare, Play, Square } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { useLiveTaskElapsed } from '@common/hooks/useLiveTaskElapsed';
import { TimerDisplay } from '@/src/features/timelogs/components/TimerDisplay';
import { TaskNameEditor } from './TaskNameEditor';
import { TaskActions } from './TaskActions';
import { Button } from '@components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';

interface SubtaskItemProps {
  key?: React.Key;
  subTask: Task;
  tasks: Task[];
  logs: TimeLog[];
  nowIso?: string;
  metrics?: import('@bindings/EngineComputedMetrics').EngineComputedMetrics | null;
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
  metrics,
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

  const { isRunning: isSubRunning, formattedElapsed: subFormattedElapsed } = useLiveTaskElapsed(subTask.id, {
    metrics,
    tasks,
    logs,
    nowIso,
  });
  const isEditing = editingId === subTask.id;

  return (
    <div
      id={`subtask-item-${subTask.id}`}
      className={`flex items-center justify-between gap-4 py-2 px-3 rounded-xl group/sub transition-all ${isSubRunning
        ? 'bg-orange-500/10 border border-orange-500/20'
        : theme === 'light'
          ? 'hover:bg-muted/80 border border-transparent text-foreground'
          : 'hover:bg-card/5 border border-transparent'
        }`}
    >
      <div className="flex items-start sm:items-center gap-2.5 flex-1 min-w-0">
        <Button
          id={`check-subtask-${subTask.id}`}
          role="checkbox"
          variant="ghost"
          size="icon-xs"
          aria-checked={subTask.completed}
          onClick={() => onToggleTaskComplete(subTask.id)}
          aria-label={`${subTask.completed ? tCommon('Edit') : tCommon('Confirm')} ${subTask.name}`}
          className={`${th.textMuted} hover:text-orange-500 transition-colors cursor-pointer mt-0.5 sm:mt-0 shrink-0 p-0 h-auto`}
        >
          {subTask.completed ? (
            <CheckSquare className="w-4 h-4 text-orange-500 fill-orange-500/10" />
          ) : (
            <EmptySquare className="w-4 h-4" />
          )}
        </Button>

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
                ? 'line-through text-muted-foreground font-normal'
                : theme === 'light'
                  ? 'text-foreground'
                  : 'text-slate-200'
                }`}
            >
              <span className="truncate block max-w-full" title={subTask.name}>
                {subTask.name}
              </span>
              <div onClick={(e) => e.stopPropagation()}>
                <Select
                  value={subTask.status || 'Todo'}
                  onValueChange={(val) => {
                    if (val && onUpdateTask) {
                      onUpdateTask(subTask.id, subTask.name, subTask.parentTaskId || null, val as TaskStatus, null);
                    }
                  }}
                >
                  <SelectTrigger
                    className={`h-5 text-[9px] font-bold px-1.5 py-0.5 rounded border font-mono shrink-0 transition-all ${subTask.status === 'Done'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : subTask.status === 'InProgress'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : subTask.status === 'Blocked'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}
                    aria-label="Subtask status"
                  >
                    <SelectValue>{subTask.status || 'Todo'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todo" className="text-xs">TODO</SelectItem>
                    <SelectItem value="InProgress" className="text-xs text-blue-400">In Progress</SelectItem>
                    <SelectItem value="Done" className="text-xs text-emerald-400">Done</SelectItem>
                    <SelectItem value="Blocked" className="text-xs text-rose-450">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isSubRunning && (
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              )}
            </span>
          )}

          {!isEditing && (
            <TaskActions
              taskId={subTask.id}
              taskName={subTask.name}
              deleteTitle={tCommon('Delete')}
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
        <TimerDisplay
          value={subFormattedElapsed}
          isRunning={isSubRunning}
          size="xs"
          variant="pill"
        />

        {isSubRunning ? (
          <Button
            id={`stop-subtask-btn-${subTask.id}`}
            variant="destructive"
            size="icon-xs"
            onClick={() => onStartTimer(subTask.id)}
            title={tTimer('StopMeasurement')}
            aria-label={tTimer('StopMeasurement')}
            className="p-2 transition-colors cursor-pointer animate-pulse shrink-0"
          >
            <Square className="w-3.5 h-3.5 fill-white text-white" />
          </Button>
        ) : (
          <Button
            id={`start-subtask-btn-${subTask.id}`}
            variant="ghost"
            size="icon-xs"
            onClick={() => !subTask.completed && onStartTimer(subTask.id)}
            disabled={subTask.completed}
            title={tTimer('StartMeasurement')}
            aria-label={tTimer('StartMeasurement')}
            className={`text-muted-foreground hover:text-white rounded-lg p-2 transition-all cursor-pointer shrink-0 ${theme === 'light'
              ? 'bg-muted hover:bg-teal-500 group-hover/sub:bg-teal-500 text-foreground'
              : 'bg-card/5 hover:bg-teal-500 group-hover/sub:bg-teal-500'
              }`}
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
          </Button>
        )}
      </div>
    </div>
  );
}

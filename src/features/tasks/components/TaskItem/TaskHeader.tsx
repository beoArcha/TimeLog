import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { CheckSquare, Square as EmptySquare } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { TaskNameEditor } from './TaskNameEditor';
import { TaskActions } from './TaskActions';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Caption } from '@components/ui/typography';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';

import { useTasksSafe } from '@common/hooks/DataContext';
import { useTaskEditing } from '../../context/TaskEditingContext';

export interface TaskHeaderProps {
  rootTask: Task;
  isCurrentRunning: boolean;
  isChildRunning: boolean;
  runningSubtask: Task | undefined;
  editingId?: string | null;
  editName?: string;
  onToggleTaskComplete?: (id: string) => void;
  onRenameTask?: ((id: string, name: string) => void) | undefined;
  onUpdateTask?: ((
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ) => void) | undefined;
  onDeleteTask?: ((id: string) => void) | undefined;
  setEditingId?: (id: string | null) => void;
  setEditName?: (name: string) => void;
}

export function TaskHeader({
  rootTask,
  isCurrentRunning,
  isChildRunning,
  runningSubtask,
  editingId: propEditingId,
  editName: propEditName,
  onToggleTaskComplete: propOnToggleTaskComplete,
  onRenameTask: propOnRenameTask,
  onUpdateTask: propOnUpdateTask,
  onDeleteTask: propOnDeleteTask,
  setEditingId: propSetEditingId,
  setEditName: propSetEditName,
}: TaskHeaderProps) {
  const tasksCtx = useTasksSafe();
  const editingCtx = useTaskEditing();

  const onToggleTaskComplete = propOnToggleTaskComplete ?? tasksCtx?.handleToggleTaskComplete ?? (() => {});
  const onRenameTask = propOnRenameTask ?? tasksCtx?.handleRenameTask;
  const onUpdateTask = propOnUpdateTask ?? tasksCtx?.handleUpdateTask;
  const onDeleteTask = propOnDeleteTask ?? tasksCtx?.handleDeleteTask;

  const editingId = propEditingId ?? editingCtx?.editingId ?? null;
  const editName = propEditName ?? editingCtx?.editName ?? '';
  const setEditingId = propSetEditingId ?? editingCtx?.setEditingId ?? (() => {});
  const setEditName = propSetEditName ?? editingCtx?.setEditName ?? (() => {});

  const isEditing = editingId === rootTask.id;
  const { t: tTask } = useTranslation('task');

  return (
    <div className={`flex items-start sm:items-center gap-section flex-1 min-w-0 w-full`}>
      <Button
        id={`check-task-${rootTask.id}`}
        role="checkbox"
        variant="ghost"
        size="icon-xs"
        aria-checked={rootTask.completed}
        onClick={() => onToggleTaskComplete(rootTask.id)}
        className="text-muted-foreground hover:text-orange-500 transition-colors cursor-pointer shrink-0 mt-0.5 sm:mt-0 p-0 h-auto"
      >
        {rootTask.completed ? (
          <CheckSquare className={`icon-medium text-orange-500 fill-orange-500/10`} />
        ) : (
          <EmptySquare className={`icon-medium`} />
        )}
      </Button>

      <div className="min-w-0 flex-1 flex items-center justify-between gap-2 group/taskedit">
        <div className="min-w-0 flex-1 flex flex-col justify-center">
          {isEditing ? (
            <TaskNameEditor
              taskId={rootTask.id}
              taskName={rootTask.name}
              editName={editName}
              isEditing={isEditing}
              textSizeClass={`font-semibold text-main`}
              onRenameTask={onRenameTask}
              setEditName={setEditName}
              setEditingId={setEditingId}
            />
          ) : (
            <span
              className={`font-semibold text-title flex flex-wrap items-center gap-2 transition-all duration-300 min-w-0 w-full ${rootTask.completed
                  ? 'line-through text-muted-foreground font-normal'
                  : 'text-foreground'
                }`}
            >
              <span className="truncate block max-w-full" title={rootTask.name}>
                {rootTask.name}
              </span>
              <div onClick={(e) => e.stopPropagation()}>
                <Select
                  value={rootTask.status || 'Todo'}
                  onValueChange={(val) => {
                    if (val && onUpdateTask) {
                      onUpdateTask(rootTask.id, rootTask.name, rootTask.parentTaskId || null, val as TaskStatus, null);
                    }
                  }}
                >
                  <SelectTrigger
                    className={`h-6 text-xs font-bold px-2 py-0.5 rounded border font-mono shrink-0 transition-all ${rootTask.status === 'Done'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : rootTask.status === 'InProgress'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : rootTask.status === 'Blocked'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                      }`}
                    aria-label="Task status"
                  >
                    <SelectValue>{rootTask.status || 'Todo'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todo" className="text-xs">TODO</SelectItem>
                    <SelectItem value="InProgress" className="text-xs text-blue-400">In Progress</SelectItem>
                    <SelectItem value="Done" className="text-xs text-emerald-400">Done</SelectItem>
                    <SelectItem value="Blocked" className="text-xs text-rose-450">Blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isChildRunning && runningSubtask && (
                <Badge variant="amber" size="sm" as="span" className="font-mono animate-pulse shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <span className="truncate max-w-[120px]" title={runningSubtask.name}>
                    {tTask('SubtaskLabel')}: {runningSubtask.name}
                  </span>
                </Badge>
              )}
              {isCurrentRunning && (
                <Badge variant="emerald" size="sm" as="span" className="font-mono animate-pulse shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                  {tTask('InProgressLabel')}
                </Badge>
              )}
            </span>
          )}

          <Caption size="2xs" className="font-mono block mt-0.5 truncate leading-tight">
            ID: {rootTask.id} • SQLite table entry {isCurrentRunning || isChildRunning ? '(Active timing)' : ''}
          </Caption>
        </div>

        {!isEditing && (
          <TaskActions
            taskId={rootTask.id}
            taskName={rootTask.name}
            deleteTitle={tTask('DeleteTask')}
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

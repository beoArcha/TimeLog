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
import { HStack, InlineCluster } from '@components/ui/stack';
import { Text } from '@components/ui/typography';
import { StatusDot } from '@components/ui/status-dot';
import { cn } from '@/lib/utils';
import { useTasksSafe, useTimerSafe } from '@common/hooks/DataContext';
import { useTaskEditing } from '../../context/TaskEditingContext';
import { TaskStatusSelect } from '../TaskStatusSelect';

export interface SubtaskItemProps {
  key?: React.Key;
  subTask: Task;
  tasks?: Task[];
  logs?: TimeLog[];
  nowIso?: string;
  metrics?: import('@bindings/EngineComputedMetrics').EngineComputedMetrics | null;
  activeLog?: TimeLog | null;
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
  onStartTimer?: (id: string) => void;
  onStopTimer?: (projectId?: string) => void;
  setEditingId?: (id: string | null) => void;
  setEditName?: (name: string) => void;
}

export function SubtaskItem({
  subTask,
  logs: propLogs,
  metrics,
  activeLog: propActiveLog,
  editingId: propEditingId,
  editName: propEditName,
  onToggleTaskComplete: propOnToggleTaskComplete,
  onRenameTask: propOnRenameTask,
  onUpdateTask: propOnUpdateTask,
  onDeleteTask: propOnDeleteTask,
  onStartTimer: propOnStartTimer,
  onStopTimer: propOnStopTimer,
  setEditingId: propSetEditingId,
  setEditName: propSetEditName,
}: SubtaskItemProps) {
  const { t: tCommon } = useTranslation('common');
  const { t: tTimer } = useTranslation('timer');

  const tasksCtx = useTasksSafe();
  const timerCtx = useTimerSafe();
  const editingCtx = useTaskEditing();

  const onToggleTaskComplete = propOnToggleTaskComplete ?? tasksCtx?.handleToggleTaskComplete ?? (() => {});
  const onRenameTask = propOnRenameTask ?? tasksCtx?.handleRenameTask;
  const onUpdateTask = propOnUpdateTask ?? tasksCtx?.handleUpdateTask;
  const onDeleteTask = propOnDeleteTask ?? tasksCtx?.handleDeleteTask;
  const onStartTimer = propOnStartTimer ?? timerCtx?.handleStartTimer ?? (() => {});
  const onStopTimer = propOnStopTimer ?? timerCtx?.handleStopTimer;

  const editingId = propEditingId ?? editingCtx?.editingId ?? null;
  const editName = propEditName ?? editingCtx?.editName ?? '';
  const setEditingId = propSetEditingId ?? editingCtx?.setEditingId ?? (() => {});
  const setEditName = propSetEditName ?? editingCtx?.setEditName ?? (() => {});

  const { isRunning: isSubRunning, formattedElapsed: subFormattedElapsed } = useLiveTaskElapsed(subTask.id, {
    metrics,
    activeLog: propActiveLog ?? timerCtx?.activeLog,
  });
  const isEditing = editingId === subTask.id;
  const timeLogsCount = (propLogs ?? timerCtx?.logs ?? []).filter((l) => l.taskId === subTask.id).length;

  return (
    <HStack
      id={`subtask-item-${subTask.id}`}
      justify="between"
      gap="lg"
      className={`py-2 px-3 rounded-xl group/sub transition-all ${isSubRunning
        ? 'bg-orange-500/10 border border-orange-500/20'
        : 'hover:bg-muted/80 border border-transparent text-foreground'
        }`}
    >
      <HStack gap="xs" align="start" className="sm:items-center flex-1 min-w-0">
        <Button
          id={`check-subtask-${subTask.id}`}
          role="checkbox"
          variant="ghost"
          size="icon-xs"
          aria-checked={subTask.completed}
          onClick={() => onToggleTaskComplete(subTask.id)}
          aria-label={`${subTask.completed ? tCommon('Edit') : tCommon('Confirm')} ${subTask.name}`}
          className="text-muted-foreground hover:text-orange-500 transition-colors cursor-pointer mt-0.5 sm:mt-0 shrink-0 p-0 h-auto"
        >
          {subTask.completed ? (
            <CheckSquare className="w-4 h-4 text-orange-500 fill-orange-500/10" />
          ) : (
            <EmptySquare className="w-4 h-4" />
          )}
        </Button>

        <HStack justify="between" align="center" className="min-w-0 flex-1 group/taskedit">
          {isEditing ? (
            <TaskNameEditor
              taskId={subTask.id}
              taskName={subTask.name}
              editName={editName}
              isEditing={isEditing}
              textSizeClass="font-semibold text-xs"
              onRenameTask={onRenameTask}
              setEditName={setEditName}
              setEditingId={setEditingId}
            />
          ) : (
            <InlineCluster gap="xs" align="center" className="min-w-0 flex-1">
              <Text
                as="span"
                size="xs"
                weight={subTask.completed ? 'normal' : 'semibold'}
                className={cn('truncate block max-w-full', subTask.completed && 'line-through text-muted-foreground')}
                title={subTask.name}
              >
                {subTask.name}
              </Text>
              <TaskStatusSelect
                status={subTask.status}
                onStatusChange={(status) => {
                  if (onUpdateTask) {
                    onUpdateTask(subTask.id, subTask.name, subTask.parentTaskId || null, status, null);
                  }
                }}
                ariaLabel={tCommon('Status')}
                size="xs"
              />
              {isSubRunning && (
                <StatusDot variant="emerald" size="2xs" ping className="shrink-0" />
              )}
            </InlineCluster>
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
              subtasksCount={0}
              timeLogsCount={timeLogsCount}
              isSubtask={true}
            />
          )}
        </HStack>
      </HStack>

      <HStack gap="md" className="shrink-0">
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
            onClick={() => onStopTimer ? onStopTimer() : onStartTimer(subTask.id)}
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
            className="text-muted-foreground hover:text-white rounded-lg p-2 transition-all cursor-pointer shrink-0 bg-muted hover:bg-teal-500 group-hover/sub:bg-teal-500 text-foreground"
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
          </Button>
        )}
      </HStack>
    </HStack>
  );
}

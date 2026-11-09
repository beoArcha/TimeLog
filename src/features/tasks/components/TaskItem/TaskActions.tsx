import React, { useState, useMemo } from 'react';
import { Pencil, Trash2, DollarSign, Clock } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { Button } from '@components/ui/button';
import { ConfirmDialog } from '@components/ConfirmDialog';
import { Text, Caption, MonoText } from '@components/ui/typography';
import { VStack, HStack } from '@components/ui/stack';
import { Badge } from '@components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@components/ui/popover';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { useTasksSafe, useTimerSafe, useDataSafe } from '@common/hooks/DataContext';
import { useSettingsSafe } from '@common/hooks/SettingsContext';
import { formatTime, formatDate } from '@common/utils/timeFormat';
import { formatSeconds } from '@features/timelogs/utils/TimelogUtils';
import { ReportLogEditModal } from '@components/ReportLogEditModal';
import { getLogDurationSeconds } from '@features/reports/utils/grouping';
import { TaskBillingModal } from '../TaskBillingModal';

export interface TaskActionsProps {
  taskId: string;
  taskName: string;
  deleteTitle: string;
  pencilSize: string;
  trashSize: string;
  onDeleteTask: ((id: string) => void) | undefined;
  setEditingId: (id: string | null) => void;
  setEditName: (name: string) => void;
  subtasksCount?: number;
  timeLogsCount?: number;
  isSubtask?: boolean;
  task?: Task;
  onUpdateRate?: (hourlyRate: string | null) => void;
  logs?: TimeLog[];
}

function resolveSourceLogs(
  propLogs?: TimeLog[],
  timerLogs?: TimeLog[],
  dataLogs?: TimeLog[]
): TimeLog[] {
  if (propLogs && propLogs.length > 0) return propLogs;
  if (timerLogs && timerLogs.length > 0) return timerLogs;
  if (dataLogs && dataLogs.length > 0) return dataLogs;
  return [];
}

function resolveEffectiveTimezoneSetting(settings: unknown): string | undefined {
  if (!settings || typeof settings !== 'object') {
    return undefined;
  }
  const s = settings as Record<string, unknown>;
  if (typeof s.resolvedTimezone === 'string') {
    return s.resolvedTimezone;
  }
  if (typeof s.timezone === 'string') {
    return s.timezone;
  }
  return undefined;
}

export function TaskActions({
  taskId,
  taskName,
  deleteTitle,
  pencilSize,
  trashSize,
  onDeleteTask,
  setEditingId,
  setEditName,
  subtasksCount = 0,
  timeLogsCount = 0,
  isSubtask = false,
  task,
  onUpdateRate,
  logs: propLogs,
}: TaskActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TimeLog | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { t: tCommon } = useTranslation('common');
  const { t: tTask, locale } = useTranslation('task');
  const tasksCtx = useTasksSafe();
  const timerCtx = useTimerSafe();
  const dataCtx = useDataSafe();
  const settingsCtx = useSettingsSafe();

  const tasksList = tasksCtx?.tasks;
  const allTasks = useMemo(() => tasksList ?? [], [tasksList]);
  const timerLogs = timerCtx?.logs;
  const dataLogs = dataCtx?.logs;
  const sourceLogs = useMemo(
    () => resolveSourceLogs(propLogs, timerLogs, dataLogs),
    [propLogs, timerLogs, dataLogs]
  );

  const descendantTaskIds = useMemo(() => {
    if (isSubtask) {
      return new Set<string>();
    }
    const ids = new Set<string>();
    const queue = [taskId];
    while (queue.length > 0) {
      const currentId = queue.pop()!;
      for (const t of allTasks) {
        if (t.parentTaskId === currentId && !ids.has(t.id)) {
          ids.add(t.id);
          queue.push(t.id);
        }
      }
    }
    return ids;
  }, [allTasks, taskId, isSubtask]);

  const matchingLogs = useMemo(() => {
    return sourceLogs.filter(
      (log) => log.taskId === taskId || descendantTaskIds.has(log.taskId)
    );
  }, [sourceLogs, taskId, descendantTaskIds]);

  const sortedLogs = useMemo(() => {
    return [...matchingLogs].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [matchingLogs]);

  const hasLogs = matchingLogs.length > 0;
  const timeZone = resolveEffectiveTimezoneSetting(settingsCtx);

  const getLogTaskName = (log: TimeLog) => {
    if (log.taskId === taskId) return taskName;
    const found = allTasks.find((t) => t.id === log.taskId);
    return found?.name ?? taskName;
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedLog(null);
  };

  const handleLogMutationSuccess = async () => {
    setIsEditModalOpen(false);
    setSelectedLog(null);
    try {
      await dataCtx?.refreshData?.();
    } catch (refreshErr) {
      console.warn('[TaskActions] refreshData failed after mutation:', refreshErr);
    }
  };

  const handleSaveRate = (rate: string | null) => {
    if (onUpdateRate) {
      onUpdateRate(rate);
    } else if (task && tasksCtx?.handleUpdateTask) {
      tasksCtx.handleUpdateTask(
        task.id,
        task.name,
        task.parentTaskId || null,
        task.status || null,
        task.completed,
        rate
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      setDeleteError(null);
      await onDeleteTask?.(taskId);
      setIsConfirmOpen(false);
    } catch (error) {
      console.error('Failed to delete task:', error);
      let message = tCommon('ErrGeneric');
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      }
      setDeleteError(message);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <HStack
        align="center"
        className="opacity-100 md:opacity-0 md:group-hover/taskedit:opacity-100 transition duration-200 shrink-0 ml-2"
      >
        {task && (
          <Button
            id={`billing-task-btn-${taskId}`}
            data-testid={`billing-task-btn-${taskId}`}
            type="button"
            variant="ghost"
            size="icon-xs"
            title={tTask('Rate')}
            aria-label={tTask('Rate')}
            onClick={(e) => {
              e.stopPropagation();
              setIsBillingOpen(true);
            }}
            className="p-1 rounded text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 cursor-pointer mr-0.5"
          >
            <DollarSign className={pencilSize} />
          </Button>
        )}

        {hasLogs && (
          <Popover open={isLogsOpen} onOpenChange={setIsLogsOpen}>
            <PopoverTrigger
              id={`clock-task-btn-${taskId}`}
              data-testid={`clock-task-btn-${taskId}`}
              type="button"
              title={tTask('TimeLogsHistory')}
              aria-label={tTask('TimeLogsHistory')}
              onClick={(e) => {
                e.stopPropagation();
                setIsLogsOpen(!isLogsOpen);
              }}
              className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer mr-0.5 transition-colors"
            >
              <Clock className={pencilSize} />
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={6}
              className="w-80 max-h-80 overflow-y-auto p-2 bg-card border-border shadow-2xl rounded-2xl"
              data-testid={`task-logs-popover-${taskId}`}
              onClick={(e) => e.stopPropagation()}
            >
              <VStack gap="xs" className="w-full">
                <HStack justify="between" align="center" className="px-2 py-1 border-b border-border/50">
                  <Text size="xs" weight="semibold" className="text-foreground">
                    {tTask('TimeLogsHistory')}
                  </Text>
                  <Caption size="2xs" className="text-muted-foreground font-mono">
                    {matchingLogs.length}
                  </Caption>
                </HStack>

                {sortedLogs.length === 0 ? (
                  <Caption size="xs" className="text-muted-foreground text-center py-4">
                    {tTask('NoLogs')}
                  </Caption>
                ) : (
                  <VStack gap="2xs" className="w-full">
                    {sortedLogs.map((log) => {
                      const durSeconds = getLogDurationSeconds(log, new Date().toISOString());
                      const isSubtaskLog = log.taskId !== taskId;
                      const formattedStart = formatTime(log.startTime, timeZone, locale);
                      const formattedEnd = log.endTime ? formatTime(log.endTime, timeZone, locale) : '...';

                      return (
                        <Button
                          key={log.id}
                          id={`log-item-${log.id}`}
                          data-testid={`log-item-${log.id}`}
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setSelectedLog(log);
                            setIsLogsOpen(false);
                            setIsEditModalOpen(true);
                          }}
                          className="w-full h-auto p-2 rounded-xl text-left justify-start items-center hover:bg-muted/80 transition-colors cursor-pointer"
                        >
                          <VStack as="span" gap="2xs" className="w-full min-w-0">
                            <HStack as="span" justify="between" align="center" className="w-full">
                              <MonoText size="2xs" weight="bold" className="text-primary truncate">
                                {formattedStart} - {formattedEnd}
                              </MonoText>
                              <MonoText size="2xs" weight="bold" className="text-orange-400 shrink-0">
                                {formatSeconds(durSeconds)}
                              </MonoText>
                            </HStack>

                            <HStack as="span" justify="between" align="center" className="w-full text-xs text-muted-foreground gap-1.5 flex-wrap">
                              <HStack as="span" align="center" gap="xs" className="min-w-0 shrink truncate">
                                {isSubtaskLog && (
                                  <Badge variant="outline" size="xs" className="truncate max-w-[120px]">
                                    {getLogTaskName(log)}
                                  </Badge>
                                )}
                                <Caption as="span" size="2xs" className="text-muted-foreground truncate">
                                  {formatDate(log.startTime, timeZone, locale)}
                                </Caption>
                              </HStack>
                              {log.note && (
                                <Caption as="span" size="2xs" className="truncate text-muted-foreground/80 italic ml-auto max-w-[120px]">
                                  {log.note}
                                </Caption>
                              )}
                            </HStack>
                          </VStack>
                        </Button>
                      );
                    })}
                  </VStack>
                )}
              </VStack>
            </PopoverContent>
          </Popover>
        )}

        <Button
          id={`edit-task-btn-${taskId}`}
          type="button"
          variant="ghost"
          size="icon-xs"
          title={tCommon('EditName')}
          aria-label={tCommon('EditName')}
          onClick={(e) => {
            e.stopPropagation();
            setEditingId(taskId);
            setEditName(taskName);
          }}
          className="p-1 rounded text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 cursor-pointer"
        >
          <Pencil className={pencilSize} />
        </Button>
        <Button
          id={`delete-task-btn-${taskId}`}
          type="button"
          variant="ghost"
          size="icon-xs"
          title={deleteTitle}
          aria-label={deleteTitle}
          onClick={(e) => {
            e.stopPropagation();
            setDeleteError(null);
            setIsConfirmOpen(true);
          }}
          className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 ml-0.5 cursor-pointer"
        >
          <Trash2 className={trashSize} />
        </Button>
      </HStack>

      {task && (
        <TaskBillingModal
          open={isBillingOpen}
          onOpenChange={setIsBillingOpen}
          task={task}
          onSaveRate={handleSaveRate}
        />
      )}

      {selectedLog && (
        <ReportLogEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          log={selectedLog}
          taskName={getLogTaskName(selectedLog)}
          projectName={
            dataCtx?.projects?.find(
              (p) => p.id === (task?.projectId ?? selectedLog.projectId)
            )?.name
          }
          onSaveSuccess={handleLogMutationSuccess}
          onDeleteSuccess={handleLogMutationSuccess}
        />
      )}

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteError(null);
          }
          setIsConfirmOpen(open);
        }}
        variant="destructive"
        loading={isDeleting}
        errorMessage={deleteError}
        onClearError={() => setDeleteError(null)}
        title={isSubtask ? tTask('ConfirmDeleteSubtaskTitle') : tTask('ConfirmDeleteTaskTitle')}
        confirmLabel={tCommon('Delete')}
        cancelLabel={tCommon('Cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteError(null);
          setIsConfirmOpen(false);
        }}
      >
        <VStack gap="xs" className="text-left mt-1">
          <Text size="sm" weight="semibold" className="text-foreground">
            {taskName}
          </Text>
          {subtasksCount > 0 && (
            <Caption variant="destructive">
              {tTask('DeleteTaskWarningSubtasks').replace('{count}', String(subtasksCount))}
            </Caption>
          )}
          {timeLogsCount > 0 && (
            <Caption variant="warning">
              {tTask('DeleteTaskWarningLogs').replace('{count}', String(timeLogsCount))}
            </Caption>
          )}
        </VStack>
      </ConfirmDialog>
    </>
  );
}

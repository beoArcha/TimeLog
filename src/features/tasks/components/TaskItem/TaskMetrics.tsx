import React, { useState, useMemo, useRef } from 'react';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { Plus, Play, Square } from 'lucide-react';
import { useTranslation } from '@common/i18n/translator';
import { useTimerSafe, useTasksSafe, useDataSafe } from '@common/hooks/DataContext';
import { useSettingsSafe } from '@common/hooks/SettingsContext';
import { useTaskEditing } from '../../context/TaskEditingContext';
import { formatSeconds } from '@/src/features/timelogs/utils/TimelogUtils';
import { Button } from '@components/ui/button';
import { HStack } from '@components/ui/stack';
import { Popover, PopoverContent } from '@components/ui/popover';
import { ReportLogEditModal } from '@components/ReportLogEditModal';
import { TaskLogsPopoverList } from './TaskLogsPopoverList';
import {
  resolveSourceLogs,
  resolveEffectiveTimezoneSetting,
} from './taskLogsUtils';

export interface TaskMetricsProps {
  rootTask: Task;
  rootDuration: number;
  isCurrentRunning: boolean;
  isAnyRunning: boolean;
  isCondensed: boolean;
  showSubtaskFormForId?: string | null;
  setShowSubtaskFormForId?: (id: string | null) => void;
  onStartTimer?: (id: string) => void;
  onStopTimer?: (projectId?: string) => void;
  logs?: TimeLog[];
  activeLog?: TimeLog | null;
  onOpenLogs?: () => void;
}

export function TaskMetrics({
  rootTask,
  rootDuration,
  isCurrentRunning,
  isAnyRunning,
  isCondensed,
  showSubtaskFormForId: propShowSubtaskFormForId,
  setShowSubtaskFormForId: propSetShowSubtaskFormForId,
  onStartTimer: propOnStartTimer,
  onStopTimer: propOnStopTimer,
  logs: propLogs,
  activeLog: propActiveLog,
  onOpenLogs,
}: TaskMetricsProps) {
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<TimeLog | null>(null);

  const counterButtonRef = useRef<HTMLButtonElement | null>(null);

  const { t: tTask } = useTranslation('task');
  const { t: tTimer } = useTranslation('timer');

  const timer = useTimerSafe();
  const tasksCtx = useTasksSafe();
  const dataCtx = useDataSafe();
  const settingsCtx = useSettingsSafe();
  const editing = useTaskEditing();

  const onStartTimer = propOnStartTimer ?? timer?.handleStartTimer ?? (() => {});
  const onStopTimer = propOnStopTimer ?? timer?.handleStopTimer;
  const showSubtaskFormForId = propShowSubtaskFormForId ?? editing?.showSubtaskFormForId ?? null;
  const setShowSubtaskFormForId =
    propSetShowSubtaskFormForId ??
    editing?.setShowSubtaskFormForId ??
    (() => {});

  const allTasks = useMemo(() => tasksCtx?.tasks ?? [], [tasksCtx?.tasks]);
  const sourceLogs = useMemo(
    () => resolveSourceLogs(propLogs, timer?.logs, dataCtx?.logs),
    [propLogs, timer?.logs, dataCtx?.logs]
  );

  const descendantTaskIds = useMemo(() => {
    const ids = new Set<string>();
    const queue = [rootTask.id];
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
  }, [allTasks, rootTask.id]);

  const matchingLogs = useMemo(() => {
    return sourceLogs.filter(
      (log) => log.taskId === rootTask.id || descendantTaskIds.has(log.taskId)
    );
  }, [sourceLogs, rootTask.id, descendantTaskIds]);

  const sortedLogs = useMemo(() => {
    return [...matchingLogs].sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }, [matchingLogs]);

  const currentActiveLog = propActiveLog !== undefined ? propActiveLog : (timer?.activeLog ?? dataCtx?.activeLog ?? null);
  const activeLogForTask = useMemo(() => {
    if (!currentActiveLog) return null;
    if (currentActiveLog.taskId === rootTask.id || descendantTaskIds.has(currentActiveLog.taskId)) {
      return currentActiveLog;
    }
    return null;
  }, [currentActiveLog, rootTask.id, descendantTaskIds]);

  const timeZone = resolveEffectiveTimezoneSetting(settingsCtx);

  const getLogTaskName = (log: TimeLog) => {
    if (log.taskId === rootTask.id) return rootTask.name;
    const found = allTasks.find((t) => t.id === log.taskId);
    return found?.name ?? rootTask.name;
  };

  const handleOpenLogsAction = () => {
    onOpenLogs?.();
    if (activeLogForTask) {
      setSelectedLog(activeLogForTask);
      setIsEditModalOpen(true);
      return;
    }
    if (matchingLogs.length === 1) {
      setSelectedLog(matchingLogs[0]);
      setIsEditModalOpen(true);
      return;
    }
    setIsLogsOpen(true);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleOpenLogsAction();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      e.stopPropagation();
      handleOpenLogsAction();
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setSelectedLog(null);
  };

  const handleLogMutationSuccess = async () => {
    setIsEditModalOpen(false);
    setSelectedLog(null);
    await dataCtx?.refreshData?.();
  };

  const formattedDuration = formatSeconds(rootDuration);
  const counterAriaLabel = `${tTask('CounterLabel')}: ${formattedDuration}. ${tTask('OpenTimeLogsHint')}`;

  return (
    <>
      <HStack
        gap="md"
        className={isCondensed ? 'w-full justify-between pt-3 border-t border-border' : ''}
      >
        <Button
          ref={counterButtonRef}
          id={`task-counter-btn-${rootTask.id}`}
          data-testid={`task-counter-btn-${rootTask.id}`}
          type="button"
          tabIndex={0}
          aria-label={counterAriaLabel}
          title={tTask('OpenTimeLogsHint')}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          variant="ghost"
          className={`h-auto text-xs font-mono font-extrabold px-3 py-1.5 rounded-full border transition-all cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
            isAnyRunning
              ? 'bg-primary/10 border-primary/20 text-primary shadow-md scale-105 animate-pulse hover:bg-primary/15 hover:text-primary'
              : 'bg-muted border-border text-foreground hover:bg-muted/80'
          }`}
        >
          {tTask('CounterLabel')}: {formattedDuration}
        </Button>

        {!rootTask.completed && (
          <HStack gap="sm" className="shrink-0">
            {isCurrentRunning ? (
              <Button
                id={`stop-btn-${rootTask.id}`}
                variant="destructive"
                size="icon-xs"
                onClick={() => {
                  if (onStopTimer) {
                    onStopTimer(rootTask.projectId);
                  } else {
                    onStartTimer(rootTask.id);
                  }
                }}
                className="rounded-xl p-2 transition-all transform hover:scale-105 cursor-pointer"
                title={tTimer('StopMeasurement')}
                aria-label={tTimer('StopMeasurement')}
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                id={`start-btn-${rootTask.id}`}
                variant="default"
                size="icon-xs"
                onClick={() => onStartTimer(rootTask.id)}
                className="rounded-xl p-2 transition-all transform hover:scale-105 cursor-pointer shadow-md"
                title={tTimer('StartMeasurement')}
                aria-label={tTimer('StartMeasurement')}
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </Button>
            )}

            <Button
              id={`show-subtask-form-btn-${rootTask.id}`}
              variant="outline"
              size="xs"
              onClick={() =>
                setShowSubtaskFormForId(showSubtaskFormForId === rootTask.id ? null : rootTask.id)
              }
              className="rounded-xl px-2.5 py-2 h-auto text-xs font-semibold flex items-center gap-1 transition-all border cursor-pointer shrink-0 bg-muted hover:bg-muted/80 text-foreground border-border"
              title={tTask('AddSubtask')}
              aria-label={tTask('AddSubtask')}
            >
              <Plus className="w-3.5 h-3.5 text-primary" />{' '}
              <span className={isCondensed ? 'hidden xs:inline' : ''}>
                {tTask('SubtaskLabel')}
              </span>
            </Button>
          </HStack>
        )}
      </HStack>

      <Popover open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <PopoverContent
          anchor={counterButtonRef}
          align="end"
          sideOffset={6}
          className="w-80 max-h-80 overflow-y-auto p-2 bg-card border-border shadow-2xl rounded-2xl"
          data-testid={`task-logs-popover-${rootTask.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <TaskLogsPopoverList
            taskId={rootTask.id}
            matchingLogs={matchingLogs}
            sortedLogs={sortedLogs}
            timeZone={timeZone}
            getLogTaskName={getLogTaskName}
            onSelectLog={(log) => {
              setSelectedLog(log);
              setIsLogsOpen(false);
              setIsEditModalOpen(true);
            }}
          />
        </PopoverContent>
      </Popover>

      {selectedLog && (
        <ReportLogEditModal
          isOpen={isEditModalOpen}
          onClose={handleEditModalClose}
          log={selectedLog}
          taskName={getLogTaskName(selectedLog)}
          projectName={
            dataCtx?.projects?.find(
              (p) => p.id === (rootTask.projectId ?? selectedLog.projectId)
            )?.name
          }
          onSaveSuccess={handleLogMutationSuccess}
          onDeleteSuccess={handleLogMutationSuccess}
        />
      )}
    </>
  );
}

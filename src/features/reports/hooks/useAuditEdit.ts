import { useState, useMemo } from 'react';
import { TimeLog } from '@bindings/TimeLog';
import { ClampedTimeLog } from '@bindings/ClampedTimeLog';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { useDataSafe } from '@common/hooks/DataContext';

export interface UseAuditEditOptions {
  logs?: TimeLog[];
  projects: Project[];
  tasks: Task[];
  activeTimerLogId?: string | null;
  onLogDeleted?: (logId: string) => void;
  onLogUpdated?: (logId: string) => void;
}

export interface UseAuditEditResult {
  editingLog: ClampedTimeLog | TimeLog | null;
  deletingLog: ClampedTimeLog | TimeLog | null;
  openEdit: (log: ClampedTimeLog | TimeLog) => void;
  closeEdit: () => void;
  openDelete: (log: ClampedTimeLog | TimeLog) => void;
  closeDelete: () => void;
  handleConfirmDelete: () => Promise<void>;
  isLogActive: (log: ClampedTimeLog | TimeLog) => boolean;
  activeEditingSourceLog: TimeLog | null;
  editingProject: Project | undefined;
  editingTask: Task | undefined;
  currentActiveId: string | null;
}

/**
 * Encapsulates audit edit modal state, delete confirmation state,
 * and data mutation operations for reports time logs.
 */
export function useAuditEdit({
  logs,
  projects,
  tasks,
  activeTimerLogId,
  onLogDeleted,
}: UseAuditEditOptions): UseAuditEditResult {
  const dataContext = useDataSafe();

  const [editingLog, setEditingLog] = useState<ClampedTimeLog | TimeLog | null>(null);
  const [deletingLog, setDeletingLog] = useState<ClampedTimeLog | TimeLog | null>(null);

  const allSourceLogs = useMemo(
    () => logs ?? dataContext?.logs ?? [],
    [logs, dataContext?.logs]
  );
  const currentActiveId = activeTimerLogId ?? dataContext?.activeLog?.id ?? null;

  const openEdit = (log: ClampedTimeLog | TimeLog) => {
    setEditingLog(log);
  };

  const closeEdit = () => {
    setEditingLog(null);
  };

  const openDelete = (log: ClampedTimeLog | TimeLog) => {
    setDeletingLog(log);
  };

  const closeDelete = () => {
    setDeletingLog(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLog) return;
    const targetId = deletingLog.id;

    if (dataContext?.handleDeleteTimeLog) {
      await dataContext.handleDeleteTimeLog(targetId);
    } else if (dataContext?.refreshData) {
      await dataContext.refreshData();
    }
    onLogDeleted?.(targetId);
    setDeletingLog(null);
  };

  const activeEditingSourceLog = useMemo(() => {
    if (!editingLog) return null;
    const found = allSourceLogs.find((l) => l.id === editingLog.id);
    return found || (editingLog as TimeLog);
  }, [editingLog, allSourceLogs]);

  const editingTask = useMemo(() => {
    if (!activeEditingSourceLog) return undefined;
    return tasks.find((t) => t.id === activeEditingSourceLog.taskId);
  }, [activeEditingSourceLog, tasks]);

  const editingProject = useMemo(() => {
    if (!activeEditingSourceLog) return undefined;
    return projects.find((p) => p.id === activeEditingSourceLog.projectId);
  }, [activeEditingSourceLog, projects]);

  const isLogActive = (log: ClampedTimeLog | TimeLog): boolean => {
    return !log.endTime || log.endTime === null || log.id === currentActiveId;
  };

  return {
    editingLog,
    deletingLog,
    openEdit,
    closeEdit,
    openDelete,
    closeDelete,
    handleConfirmDelete,
    isLogActive,
    activeEditingSourceLog,
    editingProject,
    editingTask,
    currentActiveId,
  };
}

export default useAuditEdit;

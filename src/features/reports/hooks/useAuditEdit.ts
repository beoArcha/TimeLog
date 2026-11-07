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
  deleteError: string | null;
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
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
    setDeleteError(null);
    setDeletingLog(log);
  };

  const closeDelete = () => {
    setDeleteError(null);
    setDeletingLog(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLog) return;
    const targetId = deletingLog.id;

    if (!dataContext?.handleDeleteTimeLog) {
      const err = new Error('Deletion handler is not available');
      setDeleteError(err.message);
      throw err;
    }

    try {
      const result = await dataContext.handleDeleteTimeLog(targetId);
      if (result && typeof result === 'object' && 'deleted' in result && !result.deleted) {
        const err = new Error('Failed to delete time log');
        setDeleteError(err.message);
        throw err;
      }
      setDeleteError(null);
      onLogDeleted?.(targetId);
      setDeletingLog(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete time log';
      setDeleteError(message);
      throw error;
    }
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
    deleteError,
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

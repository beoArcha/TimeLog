import { useState, useMemo, useCallback } from 'react';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';

export interface UseTaskLifecycleProps {
  tasks: Task[];
  selectedProjectId: string | null;
  onAddTask?: (projectId: string, name: string, parentTaskId: string | null) => void;
  onUpdateTask?: (
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ) => void;
  onRenameTask?: (taskId: string, newName: string) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onStartTimer?: (taskId: string) => void;
  onStopTimer?: (projectId?: string) => void;
}

/**
 * Manages task filtering for active project, task and subtask creation, inline editing, and lifecycle events.
 */
export function useTaskLifecycle({
  tasks,
  selectedProjectId,
  onAddTask,
  onUpdateTask,
  onRenameTask,
  onToggleTaskComplete,
  onDeleteTask,
  onStartTimer,
  onStopTimer,
}: UseTaskLifecycleProps) {
  const projectTasks = useMemo(() => {
    if (!selectedProjectId) return [];
    return tasks.filter((t) => t.projectId === selectedProjectId);
  }, [tasks, selectedProjectId]);

  const rootTasks = useMemo(() => {
    return projectTasks.filter((t) => !t.parentTaskId);
  }, [projectTasks]);

  // Draft state for new root task creation
  const [newTaskName, setNewTaskName] = useState('');

  const handleCreateTask = useCallback(() => {
    const trimmed = newTaskName.trim();
    if (!trimmed || !selectedProjectId || !onAddTask) return;

    onAddTask(selectedProjectId, trimmed, null);
    setNewTaskName('');
  }, [newTaskName, selectedProjectId, onAddTask]);

  // Draft state for subtask creation
  const [showSubtaskFormForId, setShowSubtaskFormForId] = useState<string | null>(null);
  const [newSubtaskName, setNewSubtaskName] = useState('');

  const openSubtaskForm = useCallback((parentTaskId: string) => {
    setShowSubtaskFormForId(parentTaskId);
    setNewSubtaskName('');
  }, []);

  const closeSubtaskForm = useCallback(() => {
    setShowSubtaskFormForId(null);
    setNewSubtaskName('');
  }, []);

  const handleCreateSubtask = useCallback(
    (parentTaskId: string) => {
      const trimmed = newSubtaskName.trim();
      if (!trimmed || !selectedProjectId || !onAddTask) return;

      onAddTask(selectedProjectId, trimmed, parentTaskId);
      closeSubtaskForm();
    },
    [newSubtaskName, selectedProjectId, onAddTask, closeSubtaskForm]
  );

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startEditingTask = useCallback((taskId: string, currentName: string) => {
    setEditingId(taskId);
    setEditName(currentName);
  }, []);

  const cancelEditingTask = useCallback(() => {
    setEditingId(null);
    setEditName('');
  }, []);

  const commitRenameTask = useCallback(
    (taskId: string) => {
      const trimmed = editName.trim();
      if (trimmed && onRenameTask) {
        onRenameTask(taskId, trimmed);
      }
      cancelEditingTask();
    },
    [editName, onRenameTask, cancelEditingTask]
  );

  const handleToggleComplete = useCallback(
    (taskId: string) => {
      onToggleTaskComplete?.(taskId);
    },
    [onToggleTaskComplete]
  );

  const handleDelete = useCallback(
    (taskId: string) => {
      onDeleteTask?.(taskId);
    },
    [onDeleteTask]
  );

  return {
    projectTasks,
    rootTasks,

    // Root task creation
    newTaskName,
    setNewTaskName,
    handleCreateTask,

    // Subtask creation
    showSubtaskFormForId,
    setShowSubtaskFormForId,
    newSubtaskName,
    setNewSubtaskName,
    openSubtaskForm,
    closeSubtaskForm,
    handleCreateSubtask,

    // Inline editing
    editingId,
    setEditingId,
    editName,
    setEditName,
    startEditingTask,
    cancelEditingTask,
    commitRenameTask,

    // Actions
    handleToggleComplete,
    handleDeleteTask: handleDelete,
    handleStartTimer: onStartTimer,
    handleStopTimer: onStopTimer,
    handleUpdateTask: onUpdateTask,
  };
}

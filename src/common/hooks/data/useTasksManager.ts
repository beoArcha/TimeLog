import { useState, type SetStateAction } from 'react';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { validateTaskName, validateTaskHierarchy } from '@plugins/engine/validation';
import { RepositoryStateHook } from './useRepositoryState';
import { AsyncActionRunnerHook } from './useAsyncActionRunner';

export interface UseTasksManagerOptions {
  repositoryState: RepositoryStateHook;
  actionRunner: AsyncActionRunnerHook;
  refreshComputedMetrics: (nowIso?: string) => Promise<unknown>;
}

export const useTasksManager = ({
  repositoryState,
  actionRunner,
  refreshComputedMetrics,
}: UseTasksManagerOptions) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const handleAddTask = async (projectId: string, name: string, parentTaskId: string | null) => {
    await actionRunner.runAction('Failed to add task', async () => {
      validateTaskName(name);
      validateTaskHierarchy(null, parentTaskId, repositoryState.tasks);
      const nextState = await PersistenceRouter.getInstance().tasks.add({ projectId, name, parentTaskId });
      repositoryState.setTasksState(nextState.tasks);
      await refreshComputedMetrics();
    });
  };

  const handleUpdateTask = async (
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ) => {
    await actionRunner.runAction('Failed to update task', async () => {
      if (name) {
        validateTaskName(name);
      }
      validateTaskHierarchy(taskId, parentTaskId, repositoryState.tasks);
      const nextState = await PersistenceRouter.getInstance().tasks.update(taskId, name, parentTaskId, status, completed);
      repositoryState.setTasksState(nextState.tasks);
      repositoryState.setLogsState(nextState.logs);
      repositoryState.setActiveLogState(nextState.activeLog);
      await refreshComputedMetrics();
    });
  };

  const handleRenameTask = async (taskId: string, newName: string) => {
    await actionRunner.runAction('Failed to rename task', async () => {
      validateTaskName(newName);
      const nextState = await PersistenceRouter.getInstance().tasks.rename(taskId, newName);
      repositoryState.setTasksState(nextState.tasks);
      await refreshComputedMetrics();
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await actionRunner.runAction('Failed to delete task', async () => {
      const nextState = await PersistenceRouter.getInstance().tasks.delete(taskId);
      repositoryState.setTasksState(nextState.tasks);
      repositoryState.setLogsState(nextState.logs);
      repositoryState.setActiveLogState(nextState.activeLog);
      await refreshComputedMetrics();
    });
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    await actionRunner.runAction('Failed to toggle task complete', async () => {
      const nextState = await PersistenceRouter.getInstance().tasks.toggleComplete(taskId);
      repositoryState.setTasksState(nextState.tasks);
      repositoryState.setLogsState(nextState.logs);
      repositoryState.setActiveLogState(nextState.activeLog);
      await refreshComputedMetrics();
    });
  };

  const setTasks = async (action: SetStateAction<Task[]>) => {
    await actionRunner.runAction(
      'Failed to set tasks',
      async () => {
        const resolved = typeof action === 'function' ? action(repositoryState.tasks) : action;
        const nextState = await PersistenceRouter.getInstance().core.overrideState({ tasks: resolved });
        repositoryState.setTasksState(nextState.tasks);
        await refreshComputedMetrics();
      },
      { withLoading: false }
    );
  };

  return {
    tasks: repositoryState.tasks,
    setTasks,
    selectedTaskId,
    setSelectedTaskId,
    handleAddTask,
    handleUpdateTask,
    handleRenameTask,
    handleDeleteTask,
    handleToggleTaskComplete,
  };
};

export type TasksManagerHook = ReturnType<typeof useTasksManager>;

import { useState, type SetStateAction } from 'react';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EngineRouter } from '@common/engine/EngineRouter';
import { WorkflowRouter } from '@common/workflows/WorkflowRouter';
import { ErrorHandler } from '@common/exceptions/ErrorHandler';
import { WorkflowException } from '@common/exceptions/AppExceptions';
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
      await EngineRouter.getInstance().validation.validateTaskName(name);
      await EngineRouter.getInstance().validation.validateTaskHierarchy(null, parentTaskId, repositoryState.tasks);
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
      const isCompleting = completed === true || status === 'Done';
      if (isCompleting && repositoryState.activeLog?.taskId === taskId) {
        try {
          const config = await WorkflowRouter.getInstance().getConfig();
          if (config.autoStopOnTaskComplete) {
            await EngineRouter.getInstance().timer.stopTimer();
          }
        } catch (error) {
          ErrorHandler.handle(
            new WorkflowException(
              'Failed checking workflow auto-stop on task update',
              error,
              'WARN_WORKFLOW_TASK_COMPLETE',
              'WARN'
            )
          );
        }
      }

      if (name) {
        await EngineRouter.getInstance().validation.validateTaskName(name);
      }
      await EngineRouter.getInstance().validation.validateTaskHierarchy(taskId, parentTaskId, repositoryState.tasks);
      const nextState = await PersistenceRouter.getInstance().tasks.update(taskId, name, parentTaskId, status, completed);
      repositoryState.setTasksState(nextState.tasks);
      repositoryState.setLogsState(nextState.logs);
      repositoryState.setActiveLogState(nextState.activeLog);
      await refreshComputedMetrics();
    });
  };

  const handleRenameTask = async (taskId: string, newName: string) => {
    await actionRunner.runAction('Failed to rename task', async () => {
      await EngineRouter.getInstance().validation.validateTaskName(newName);
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
      const task = repositoryState.tasks.find((t) => t.id === taskId);
      const isCompleting = task ? !task.completed : false;

      if (isCompleting && repositoryState.activeLog?.taskId === taskId) {
        try {
          const config = await WorkflowRouter.getInstance().getConfig();
          if (config.autoStopOnTaskComplete) {
            await EngineRouter.getInstance().timer.stopTimer();
          }
        } catch (error) {
          ErrorHandler.handle(
            new WorkflowException(
              'Failed checking workflow auto-stop on task completion toggle',
              error,
              'WARN_WORKFLOW_TASK_COMPLETE',
              'WARN'
            )
          );
        }
      }

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

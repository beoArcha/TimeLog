import { useState, type SetStateAction } from 'react';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { TimeLog } from '@bindings/TimeLog';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EngineRouter } from '@common/engine/EngineRouter';
import { WorkflowRouter } from '@common/workflows/WorkflowRouter';
import { RepositoryStateHook } from './useRepositoryState';
import { AsyncActionRunnerHook } from './useAsyncActionRunner';

export interface TaskInputData {
  projectId: string;
  name: string;
  parentTaskId?: string | null;
  hourlyRate?: string | null;
}

export interface TaskUpdateData {
  name: string;
  parentTaskId?: string | null;
  status?: TaskStatus | null;
  completed?: boolean | null;
  hourlyRate?: string | null;
}

export interface UseTasksManagerOptions {
  repositoryState: RepositoryStateHook;
  actionRunner: AsyncActionRunnerHook;
  refreshComputedMetrics: (nowIso?: string) => Promise<unknown>;
  engineRouter?: EngineRouter;
  persistenceRouter?: PersistenceRouter;
  workflowRouter?: WorkflowRouter;
}

const isTaskOrDescendant = (
  candidateTaskId: string,
  targetTaskId: string,
  allTasks: readonly Task[]
): boolean => {
  if (candidateTaskId === targetTaskId) {
    return true;
  }
  const visited = new Set<string>([candidateTaskId]);
  let current = allTasks.find((t) => t.id === candidateTaskId);
  while (current?.parentTaskId && !visited.has(current.parentTaskId)) {
    if (current.parentTaskId === targetTaskId) {
      return true;
    }
    visited.add(current.parentTaskId);
    current = allTasks.find((t) => t.id === current?.parentTaskId);
  }
  return false;
};

const stopActiveTimersForTaskAndDescendants = async (
  targetTaskId: string,
  allTasks: readonly Task[],
  activeLogs: readonly TimeLog[],
  fallbackActiveLog: TimeLog | null,
  engineRouter: EngineRouter
) => {
  let logsToInspect = activeLogs;
  if (logsToInspect.length === 0 && fallbackActiveLog) {
    logsToInspect = [fallbackActiveLog];
  }

  const matchingLogs = logsToInspect.filter((l) =>
    isTaskOrDescendant(l.taskId, targetTaskId, allTasks)
  );

  const projectIds = new Set<string>();
  for (const log of matchingLogs) {
    const projId =
      log.projectId || allTasks.find((t) => t.id === log.taskId)?.projectId;
    if (projId) {
      projectIds.add(projId);
    }
  }

  for (const projectId of projectIds) {
    await engineRouter.timer.stopTimer(projectId);
  }
};

export const useTasksManager = ({
  repositoryState,
  actionRunner,
  refreshComputedMetrics,
  engineRouter = EngineRouter.getInstance(),
  persistenceRouter = PersistenceRouter.getInstance(),
  workflowRouter: _workflowRouter = WorkflowRouter.getInstance(),
}: UseTasksManagerOptions) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const syncState = async (nextState: TimerRepositoryState) => {
    repositoryState.syncRepositoryState(nextState);
    await refreshComputedMetrics();
  };

  const handleAddTask = async (
    projectIdOrInput: string | TaskInputData,
    name = '',
    parentTaskId: string | null = null,
    hourlyRate: string | null = null
  ) => {
    const input: TaskInputData =
      typeof projectIdOrInput === 'object'
        ? projectIdOrInput
        : { projectId: projectIdOrInput, name, parentTaskId, hourlyRate };

    await actionRunner.runAction('Failed to add task', async () => {
      await engineRouter.validation.validateTaskName(input.name);
      await engineRouter.validation.validateTaskHierarchy(
        null,
        input.parentTaskId ?? null,
        repositoryState.tasks
      );
      const nextState = await persistenceRouter.tasks.add({
        projectId: input.projectId,
        name: input.name,
        parentTaskId: input.parentTaskId ?? null,
        hourlyRate: input.hourlyRate ?? null,
      });
      await syncState(nextState);
    });
  };

  const handleUpdateTask = async (
    taskId: string,
    nameOrInput: string | TaskUpdateData,
    parentTaskId: string | null = null,
    status: TaskStatus | null = null,
    completed: boolean | null = null,
    hourlyRate?: string | null
  ) => {
    const input: TaskUpdateData =
      typeof nameOrInput === 'object'
        ? nameOrInput
        : { name: nameOrInput, parentTaskId, status, completed, hourlyRate };

    await actionRunner.runAction('Failed to update task', async () => {
      const currentTask = repositoryState.tasks.find((t) => t.id === taskId);
      const isAlreadyCompleted = currentTask
        ? currentTask.completed || currentTask.status === 'Done'
        : false;
      const isCompleting =
        !isAlreadyCompleted &&
        (input.completed === true || input.status === 'Done');

      if (isCompleting) {
        await stopActiveTimersForTaskAndDescendants(
          taskId,
          repositoryState.tasks,
          repositoryState.activeLogs,
          repositoryState.activeLog,
          engineRouter
        );
      }

      if (input.name) {
        await engineRouter.validation.validateTaskName(input.name);
      }
      await engineRouter.validation.validateTaskHierarchy(
        taskId,
        input.parentTaskId ?? null,
        repositoryState.tasks
      );
      const nextState = await persistenceRouter.tasks.update(
        taskId,
        input.name,
        input.parentTaskId ?? null,
        input.status ?? null,
        input.completed ?? null,
        input.hourlyRate
      );
      await syncState(nextState);
    });
  };

  const handleRenameTask = async (taskId: string, newName: string) => {
    await actionRunner.runAction('Failed to rename task', async () => {
      await engineRouter.validation.validateTaskName(newName);
      const nextState = await persistenceRouter.tasks.rename(taskId, newName);
      await syncState(nextState);
    });
  };

  const handleDeleteTask = async (taskId: string) => {
    await actionRunner.runAction('Failed to delete task', async () => {
      await stopActiveTimersForTaskAndDescendants(
        taskId,
        repositoryState.tasks,
        repositoryState.activeLogs,
        repositoryState.activeLog,
        engineRouter
      );

      const nextState = await persistenceRouter.tasks.delete(taskId);
      await syncState(nextState);
    });
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    await actionRunner.runAction('Failed to toggle task complete', async () => {
      const currentTask = repositoryState.tasks.find((t) => t.id === taskId);
      const isAlreadyCompleted = currentTask
        ? currentTask.completed || currentTask.status === 'Done'
        : false;
      const isCompleting = !isAlreadyCompleted;

      if (isCompleting) {
        await stopActiveTimersForTaskAndDescendants(
          taskId,
          repositoryState.tasks,
          repositoryState.activeLogs,
          repositoryState.activeLog,
          engineRouter
        );
      }

      const nextState = await persistenceRouter.tasks.toggleComplete(taskId);
      await syncState(nextState);
    });
  };

  const setTasks = async (action: SetStateAction<Task[]>) => {
    await actionRunner.runAction(
      'Failed to set tasks',
      async () => {
        const resolved = typeof action === 'function' ? action(repositoryState.tasks) : action;
        const nextState = await persistenceRouter.core.overrideState({ tasks: resolved });
        await syncState(nextState);
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

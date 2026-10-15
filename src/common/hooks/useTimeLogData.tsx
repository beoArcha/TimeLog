import React, { useState } from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { TimeLog } from '@bindings/TimeLog';
import { ErrorHandler, RepositoryException } from '../exceptions';
import { PersistenceRouter } from '../persistence/PersistenceRouter';
import { EngineRouter } from '../engine/EngineRouter';
import { ApiPayload } from '../persistence/IPersistence';
import { validateProjectName, validateTaskName, validateTaskHierarchy } from '@plugins/engine/validation';
import { useHolidaysManager } from './data/useHolidaysManager';
import { usePatchesManager } from './data/usePatchesManager';
import { useMetricsManager } from './data/useMetricsManager';
import { useRepositoryState } from './data/useRepositoryState';
import { useAsyncActionRunner } from './data/useAsyncActionRunner';
import { useDataLifecycle } from './data/useDataLifecycle';

const repository = PersistenceRouter.getInstance();

export { type ApiPayload };

export const useTimeLogData = (pushToApi: (payload: ApiPayload, logMsg: string) => void) => {
  const repositoryState = useRepositoryState();
  const {
    projects, setProjectsState,
    tasks, setTasksState,
    logs, setLogsState,
    activeLog, setActiveLogState,
  } = repositoryState;

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const actionRunner = useAsyncActionRunner();
  const {
    isLoading,
    setIsLoading,
    repositoryError,
    setRepositoryError,
  } = actionRunner;

  const {
    computedMetrics,
    fetchComputedMetrics,
  } = useMetricsManager();

  const holidaysManager = useHolidaysManager({ onError: setRepositoryError });
  const {
    holidays,
    setHolidays,
    handleAddHoliday,
    handleDeleteHoliday,
  } = holidaysManager;

  const patchesManager = usePatchesManager({ onError: setRepositoryError });
  const {
    patches,
    setPatches,
  } = patchesManager;

  const {
    isInitialized,
    setIsInitialized,
    engineState,
    setEngineState,
    handleResetLocalStorage,
    handleRestoreState,
  } = useDataLifecycle({
    repositoryState,
    holidaysManager,
    patchesManager,
    actionRunner,
    refreshComputedMetrics: fetchComputedMetrics,
    onTaskSelected: setSelectedTaskId,
  });

  const handleAddProject = async (
    name: string,
    color: string,
    description: string | null = null,
    icon: string | null = null,
    tags: string[] | null = null
  ) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      validateProjectName(name, projects);
      const nextState = await repository.projects.add({ name, color, description, icon, tags });
      setProjectsState(nextState.projects);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to add project', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to add project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProjectArchive = async (projectId: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      const nextState = await repository.projects.toggleArchive(projectId);
      setProjectsState(nextState.projects);
      setLogsState(nextState.logs);
      setActiveLogState(nextState.activeLog);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to toggle project archive', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to toggle project archive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (projectId: string, name: string, parentTaskId: string | null) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      validateTaskName(name);
      validateTaskHierarchy(null, parentTaskId, tasks);
      const nextState = await repository.tasks.add({ projectId, name, parentTaskId });
      setTasksState(nextState.tasks);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to add task', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async (
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      validateProjectName(name, projects, projectId);
      const nextState = await repository.projects.update(projectId, name, color, description, icon, tags);
      setProjectsState(nextState.projects);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to update project', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTask = async (
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      if (name) {
        validateTaskName(name);
      }
      validateTaskHierarchy(taskId, parentTaskId, tasks);
      const nextState = await repository.tasks.update(taskId, name, parentTaskId, status, completed);
      setTasksState(nextState.tasks);
      setLogsState(nextState.logs);
      setActiveLogState(nextState.activeLog);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to update task', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      validateProjectName(newName, projects, projectId);
      const nextState = await repository.projects.rename(projectId, newName);
      setProjectsState(nextState.projects);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to rename project', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to rename project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameTask = async (taskId: string, newName: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      validateTaskName(newName);
      const nextState = await repository.tasks.rename(taskId, newName);
      setTasksState(nextState.tasks);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to rename task', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to rename task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      const nextState = await repository.tasks.delete(taskId);
      setTasksState(nextState.tasks);
      setLogsState(nextState.logs);
      setActiveLogState(nextState.activeLog);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to delete task', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      const nextState = await repository.tasks.toggleComplete(taskId);
      setTasksState(nextState.tasks);
      setLogsState(nextState.logs);
      setActiveLogState(nextState.activeLog);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to toggle task complete', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to toggle task complete');
    } finally {
      setIsLoading(false);
    }
  };


  const notifyActiveLogChanges = (prevLogs: TimeLog[], nextLogs: TimeLog[]) => {
    const prevActive = prevLogs.filter(l => !l.endTime);
    const nextActive = nextLogs.filter(l => !l.endTime);

    for (const prev of prevActive) {
      if (!nextActive.some(n => n.id === prev.id)) {
        const stopped = nextLogs.find(l => l.id === prev.id) ?? {
          ...prev,
          endTime: new Date().toISOString(),
        };
        pushToApi({ event: 'TERMINATE', log: stopped }, `Terminating ${stopped.id}`);
      }
    }

    for (const next of nextActive) {
      if (!prevActive.some(p => p.id === next.id)) {
        pushToApi({ event: 'START', log: next }, `Starting ${next.id}`);
      }
    }
  };

  const handleStartTimer = async (taskId: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);

      const prevLogs = logs;

      await EngineRouter.getInstance().startTimer(taskId);
      const nextState = await repository.core.load();

      if (nextState) {
        setLogsState(nextState.logs);
        setActiveLogState(nextState.activeLog);
        await fetchComputedMetrics();
        notifyActiveLogChanges(prevLogs, nextState.logs);
      }
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to start timer', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to start timer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTimer = async (specificProjectId?: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);

      const prevLogs = logs;

      await EngineRouter.getInstance().stopTimer(specificProjectId);
      const nextState = await repository.core.load();

      if (nextState) {
        setLogsState(nextState.logs);
        setActiveLogState(nextState.activeLog);
        await fetchComputedMetrics();
        notifyActiveLogChanges(prevLogs, nextState.logs);
      }
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to stop timer', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to stop timer');
    } finally {
      setIsLoading(false);
    }
  };



  const setProjects = async (action: React.SetStateAction<Project[]>) => {
    try {
      setRepositoryError(null);
      const resolved = typeof action === 'function' ? action(projects) : action;
      const nextState = await repository.core.overrideState({ projects: resolved });
      setProjectsState(nextState.projects);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set projects', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to set projects');
    }
  };

  const setTasks = async (action: React.SetStateAction<Task[]>) => {
    try {
      setRepositoryError(null);
      const resolved = typeof action === 'function' ? action(tasks) : action;
      const nextState = await repository.core.overrideState({ tasks: resolved });
      setTasksState(nextState.tasks);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set tasks', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to set tasks');
    }
  };

  const setLogs = async (action: React.SetStateAction<TimeLog[]>) => {
    try {
      setRepositoryError(null);
      const resolved = typeof action === 'function' ? action(logs) : action;
      const nextState = await repository.core.overrideState({ logs: resolved });
      setLogsState(nextState.logs);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set logs', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to set logs');
    }
  };

  const setActiveLog = async (action: React.SetStateAction<TimeLog | null>) => {
    try {
      setRepositoryError(null);
      const resolved = typeof action === 'function' ? action(activeLog) : action;
      const nextState = await repository.core.overrideState({ activeLog: resolved });
      setActiveLogState(nextState.activeLog);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set active log', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to set active log');
    }
  };

  const handleEditTimeLog = async (
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void> => {
    try {
      setIsLoading(true);
      setRepositoryError(null);

      await EngineRouter.getInstance().editTimeLog(id, taskId, startTime, endTime, note, reason);

      const nextState = await repository.core.load();
      if (nextState) {
        setLogsState(nextState.logs);
        setActiveLogState(nextState.activeLog);
        await fetchComputedMetrics();
      }
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to edit time log', err, 'ERR_REPOSITORY_EDIT_TIME_LOG'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to edit time log');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };





  return {
    projects, setProjects,
    tasks, setTasks,
    logs, setLogs,
    activeLog, setActiveLog,
    computedMetrics,
    refreshComputedMetrics: fetchComputedMetrics,
    holidays, setHolidays,
    patches, setPatches,
    selectedTaskId, setSelectedTaskId,
    isInitialized, setIsInitialized,
    isLoading,
    repositoryError,
    engineState, setEngineState,
    handleAddProject,
    handleToggleProjectArchive,
    handleAddTask,
    handleUpdateProject,
    handleUpdateTask,
    handleRenameProject,
    handleRenameTask,
    handleDeleteTask,
    handleToggleTaskComplete,
    handleStartTimer,
    handleStopTimer,
    handleEditTimeLog,
    handleResetLocalStorage,
    handleRestoreState,
    handleAddHoliday,
    handleDeleteHoliday,
  };
};

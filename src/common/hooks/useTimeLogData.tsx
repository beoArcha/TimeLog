import React, { useState, useEffect, useRef } from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { ErrorHandler, RepositoryException } from '../exceptions';
import { PersistenceRouter } from '../persistence/PersistenceRouter';
import { EngineRouter } from '../engine/EngineRouter';
import { ApiPayload } from '../persistence/IPersistence';
import { validateProjectName, validateTaskName, validateTaskHierarchy } from '../../plugins/engine/validation';

const repository = PersistenceRouter.getInstance();

export { type ApiPayload };

export const useTimeLogData = (pushToApi: (payload: ApiPayload, logMsg: string) => void) => {
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [logs, setLogsState] = useState<TimeLog[]>([]);
  const [activeLog, setActiveLogState] = useState<TimeLog | null>(null);
  const [computedMetrics, setComputedMetrics] = useState<EngineComputedMetrics | null>(null);

  const [holidays, setHolidaysState] = useState<HolidayLeave[]>([]);
  const [patches, setPatchesState] = useState<PatchLog[]>([]);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [repositoryError, setRepositoryError] = useState<string | null>(null);
  const [engineState, setEngineState] = useState<'searching' | 'connected'>('connected');

  const isResetting = useRef(false);
  const engine = EngineRouter.getInstance();

  const fetchComputedMetrics = async (nowIso?: string) => {
    try {
      const metrics = await engine.getComputedMetrics(nowIso);
      setComputedMetrics(prev => {
        if (!prev) return metrics;
        const tasksEqual = JSON.stringify(prev.tasks) === JSON.stringify(metrics.tasks);
        const projectsEqual = JSON.stringify(prev.projects) === JSON.stringify(metrics.projects);
        if (tasksEqual && projectsEqual && prev.snapshotNowIso === metrics.snapshotNowIso) {
          return prev;
        }
        return metrics;
      });
      return metrics;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const loadState = async () => {
      try {
        setIsLoading(true);
        const [state, loadedHolidays, loadedPatches] = await Promise.all([
          repository.core.load(),
          repository.holidays.getAll(),
          repository.patches.getAll()
        ]);

        if (state !== null) {
          setProjectsState(state.projects);
          setTasksState(state.tasks);
          setLogsState(state.logs);
          setActiveLogState(state.activeLog);
          setSelectedTaskId(state.tasks?.[0]?.id ?? null);
        }
        setHolidaysState(loadedHolidays);
        setPatchesState(loadedPatches);
        await fetchComputedMetrics();
      } catch (err) {
        ErrorHandler.handle(new RepositoryException('Failed to load repository state', err, 'ERR_REPOSITORY'));
        setRepositoryError(err instanceof Error ? err.message : 'Failed to load repository state');
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };
    loadState();
  }, []);

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

  const handleResetLocalStorage = async () => {
    try {
      isResetting.current = true;
      setIsLoading(true);
      setRepositoryError(null);
      await repository.core.reset();
      window.location.reload();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to reset storage', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to reset storage');
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

  const handleRestoreState = async (data: {
    projects?: Project[];
    tasks?: Task[];
    logs?: TimeLog[];
    holidays?: HolidayLeave[];
    patches?: PatchLog[];
  }) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      const payload: Partial<TimerRepositoryState> = {};
      if (data.projects) payload.projects = data.projects;
      if (data.tasks) payload.tasks = data.tasks;
      if (data.logs) payload.logs = data.logs;

      const nextState = await repository.core.overrideState(payload);

      if (data.projects) setProjectsState(nextState.projects);
      if (data.tasks) setTasksState(nextState.tasks);
      if (data.logs) setLogsState(nextState.logs);
      if (nextState.activeLog !== undefined) setActiveLogState(nextState.activeLog);

      if (data.holidays) setHolidays(data.holidays);
      if (data.patches) setPatches(data.patches);
      await fetchComputedMetrics();
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to restore database state', err, 'ERR_REPOSITORY_RESTORE'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to restore database state');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const setHolidays = async (action: React.SetStateAction<HolidayLeave[]>) => {
    try {
      setRepositoryError(null);
      const resolved = typeof action === 'function' ? action(holidays) : action;
      await repository.holidays.save(resolved);
      setHolidaysState(resolved);
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set holidays', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to set holidays');
    }
  };

  const setPatches = async (action: React.SetStateAction<PatchLog[]>) => {
    try {
      setRepositoryError(null);
      const resolved = typeof action === 'function' ? action(patches) : action;
      await repository.patches.save(resolved);
      setPatchesState(resolved);
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set patches', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to set patches');
    }
  };

  const handleAddHoliday = async (date: string, type: 'holiday' | 'leave', name: string) => {
    const nextHolidays = [...holidays, {
      id: crypto.randomUUID(),
      date,
      type,
      name
    }];
    await setHolidays(nextHolidays);
  };

  const handleDeleteHoliday = async (id: string) => {
    const nextHolidays = holidays.filter(x => x.id !== id);
    await setHolidays(nextHolidays);
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


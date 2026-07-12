import React, { useState, useEffect, useRef } from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { LocalStorageDataManager } from '@/src/plugins/persistence/DataManager';
import { STORAGE_KEYS } from '@common/constants';
import { ErrorHandler, RepositoryException } from '../exceptions';
import { DEFAULT_HOLIDAYS, INIT_PROJECTS, INIT_TASKS, INIT_LOGS } from '@/src/features/timelogs/utils/InitialData';
import { PersistenceRouter } from '../persistence/PersistenceRouter';
import { EngineRouter } from '../engine/EngineRouter';
import { ApiPayload } from '../persistence/IPersistence';

const dm = new LocalStorageDataManager(STORAGE_KEYS.STATE_DB);
const repository = PersistenceRouter.getInstance();

export { type ApiPayload };

export const useTimeLogData = (pushToApi: (payload: ApiPayload, logMsg: string) => void) => {
  const [projects, setProjectsState] = useState<Project[]>(INIT_PROJECTS);
  const [tasks, setTasksState] = useState<Task[]>(INIT_TASKS);
  const [logs, setLogsState] = useState<TimeLog[]>(INIT_LOGS);
  const [activeLog, setActiveLogState] = useState<TimeLog | null>(null);

  const [holidays, setHolidays] = useState<HolidayLeave[]>(() => dm.loadState()?.holidays ?? DEFAULT_HOLIDAYS);
  const [patches, setPatches] = useState<PatchLog[]>(() => dm.loadState()?.patches ?? []);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [repositoryError, setRepositoryError] = useState<string | null>(null);
  const [engineState, setEngineState] = useState<'searching' | 'connected'>('connected');
  const [enginePID, setEnginePID] = useState<number>(() => Math.floor(2500 + Math.random() * 5000));

  const isSeedingRequired = useRef(false);
  const isResetting = useRef(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        setIsLoading(true);
        const state = await repository.core.load();
        if (state === null) {
          isSeedingRequired.current = true;
          setProjectsState(INIT_PROJECTS);
          setTasksState(INIT_TASKS);
          setLogsState(INIT_LOGS);
          setActiveLogState(null);
          setSelectedTaskId(INIT_TASKS[1]?.id ?? null);
        } else {
          setProjectsState(state.projects);
          setTasksState(state.tasks);
          setLogsState(state.logs);
          setActiveLogState(state.activeLog);
          setSelectedTaskId(state.tasks?.[0]?.id ?? (INIT_TASKS[1]?.id ?? null));
        }
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

  useEffect(() => {
    if (isInitialized && !isResetting.current) {
      dm.saveState({
        projects,
        tasks,
        logs,
        activeLog,
        holidays,
        patches,
      });
    }
  }, [holidays, patches, isInitialized, projects, tasks, logs, activeLog]);

  const ensureSeeded = async () => {
    if (isSeedingRequired.current) {
      isSeedingRequired.current = false;
      await repository.core.overrideState({
        projects,
        tasks,
        logs,
        activeLog,
      });
    }
  };

  const handleAddProject = async (name: string, color: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();
      const nextState = await repository.projects.add({ name, color });
      setProjectsState(nextState.projects);
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
      await ensureSeeded();
      const nextState = await repository.projects.toggleArchive(projectId);
      setProjectsState(nextState.projects);
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
      await ensureSeeded();
      const nextState = await repository.tasks.add({ projectId, name, parentTaskId });
      setTasksState(nextState.tasks);
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to add task', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to add task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();
      const nextState = await repository.projects.rename(projectId, newName);
      setProjectsState(nextState.projects);
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
      await ensureSeeded();
      const nextState = await repository.tasks.rename(taskId, newName);
      setTasksState(nextState.tasks);
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
      await ensureSeeded();
      const nextState = await repository.tasks.delete(taskId);
      setTasksState(nextState.tasks);
      setLogsState(nextState.logs);
      setActiveLogState(nextState.activeLog);
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
      await ensureSeeded();
      const nextState = await repository.tasks.toggleComplete(taskId);
      setTasksState(nextState.tasks);
      setLogsState(nextState.logs);
      setActiveLogState(nextState.activeLog);
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to toggle task complete', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to toggle task complete');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimer = async (taskId: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();

      const prevStateLogs = logs;
      const prevActiveLogs = prevStateLogs.filter(l => l.endTime === null || l.endTime === undefined);

      await EngineRouter.getInstance().startTimer(taskId);
      const nextState = await repository.core.load();

      if (nextState) {
        const nextActiveLogs = nextState.logs.filter(l => l.endTime === null || l.endTime === undefined);
        const events: ApiPayload[] = [];

        prevActiveLogs.forEach(prev => {
          const isStillActive = nextActiveLogs.some(n => n.id === prev.id);
          if (!isStillActive) {
            const stoppedLog = nextState.logs.find(l => l.id === prev.id);
            if (stoppedLog) {
              events.push({ event: 'TERMINATE', log: stoppedLog });
            }
          }
        });

        nextActiveLogs.forEach(next => {
          const wasActive = prevActiveLogs.some(p => p.id === next.id);
          if (!wasActive) {
            events.push({ event: 'START', log: next });
          }
        });

        setLogsState(nextState.logs);
        setActiveLogState(nextState.activeLog);

        events.forEach(evt => {
          pushToApi(evt, evt.event === 'START' ? `Starting ${evt.log.id}` : `Terminating ${evt.log.id}`);
        });
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
      await ensureSeeded();

      const prevStateLogs = logs;
      const prevActiveLogs = prevStateLogs.filter(l => l.endTime === null || l.endTime === undefined);

      await EngineRouter.getInstance().stopTimer(specificProjectId);
      const nextState = await repository.core.load();

      if (nextState) {
        const nextActiveLogs = nextState.logs.filter(l => l.endTime === null || l.endTime === undefined);
        const events: ApiPayload[] = [];

        prevActiveLogs.forEach(prev => {
          const isStillActive = nextActiveLogs.some(n => n.id === prev.id);
          if (!isStillActive) {
            const stoppedLog = nextState.logs.find(l => l.id === prev.id);
            if (stoppedLog) {
              events.push({ event: 'TERMINATE', log: stoppedLog });
            }
          }
        });

        setLogsState(nextState.logs);
        setActiveLogState(nextState.activeLog);

        events.forEach(evt => {
          pushToApi(evt, `Terminating ${evt.log.id}`);
        });
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
      dm.clearState();
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
      await ensureSeeded();
      const resolved = typeof action === 'function' ? action(projects) : action;
      const nextState = await repository.core.overrideState({ projects: resolved });
      setProjectsState(nextState.projects);
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set projects', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to set projects');
    }
  };

  const setTasks = async (action: React.SetStateAction<Task[]>) => {
    try {
      setRepositoryError(null);
      await ensureSeeded();
      const resolved = typeof action === 'function' ? action(tasks) : action;
      const nextState = await repository.core.overrideState({ tasks: resolved });
      setTasksState(nextState.tasks);
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set tasks', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to set tasks');
    }
  };

  const setLogs = async (action: React.SetStateAction<TimeLog[]>) => {
    try {
      setRepositoryError(null);
      await ensureSeeded();
      const resolved = typeof action === 'function' ? action(logs) : action;
      const nextState = await repository.core.overrideState({ logs: resolved });
      setLogsState(nextState.logs);
    } catch (err) {
      ErrorHandler.handle(new RepositoryException('Failed to set logs', err, 'ERR_REPOSITORY'));
      setRepositoryError(err instanceof Error ? err.message : 'Failed to set logs');
    }
  };

  const setActiveLog = async (action: React.SetStateAction<TimeLog | null>) => {
    try {
      setRepositoryError(null);
      await ensureSeeded();
      const resolved = typeof action === 'function' ? action(activeLog) : action;
      const nextState = await repository.core.overrideState({ activeLog: resolved });
      setActiveLogState(nextState.activeLog);
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
      await ensureSeeded();

      await EngineRouter.getInstance().editTimeLog(id, taskId, startTime, endTime, note, reason);

      const nextState = await repository.core.load();
      if (nextState) {
        setLogsState(nextState.logs);
        setActiveLogState(nextState.activeLog);
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
    holidays, setHolidays,
    patches, setPatches,
    selectedTaskId, setSelectedTaskId,
    isInitialized, setIsInitialized,
    isLoading,
    repositoryError,
    engineState, setEngineState,
    enginePID, setEnginePID,
    handleAddProject,
    handleToggleProjectArchive,
    handleAddTask,
    handleRenameProject,
    handleRenameTask,
    handleDeleteTask,
    handleToggleTaskComplete,
    handleStartTimer,
    handleStopTimer,
    handleEditTimeLog,
    handleResetLocalStorage,
  };
};

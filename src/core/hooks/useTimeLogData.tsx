import React, { useState, useEffect, useRef } from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { LocalStorageDataManager } from '@core/data/dataManager';
import { STORAGE_KEYS } from '@common/constants';
import { DEFAULT_HOLIDAYS, INIT_PROJECTS, INIT_TASKS, INIT_LOGS } from '../../features/timelogs/initialData';
import { RepositoryManager } from '../repository/RepositoryManager';
import { ApiPayload } from '../repository/RepositoryTypes';

const dm = new LocalStorageDataManager(STORAGE_KEYS.STATE_DB);
const repository = RepositoryManager.getInstance();

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
        const state = await repository.load();
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
      } catch (err: any) {
        setRepositoryError(err.message || 'Failed to load repository state');
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
      await repository.overrideState({
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
      const nextState = await repository.addProject({ name, color });
      setProjectsState(nextState.projects);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to add project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleProjectArchive = async (projectId: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();
      const nextState = await repository.toggleProjectArchive(projectId);
      setProjectsState(nextState.projects);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to toggle project archive');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTask = async (projectId: string, name: string, parentTaskId: string | null) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();
      const nextState = await repository.addTask({ projectId, name, parentTaskId });
      setTasksState(nextState.tasks);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to add task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameProject = async (projectId: string, newName: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();
      const nextState = await repository.renameProject(projectId, newName);
      setProjectsState(nextState.projects);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to rename project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameTask = async (taskId: string, newName: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();
      const nextState = await repository.renameTask(taskId, newName);
      setTasksState(nextState.tasks);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to rename task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();
      const nextState = await repository.deleteTask(taskId);
      setTasksState(nextState.tasks);
      setLogsState(nextState.logs);
      setActiveLogState(nextState.activeLog);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to delete task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();
      const nextState = await repository.toggleTaskComplete(taskId);
      setTasksState(nextState.tasks);
      setLogsState(nextState.logs);
      setActiveLogState(nextState.activeLog);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to toggle task complete');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartTimer = async (taskId: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();
      const { state: nextState, events } = await repository.startTimer(taskId);

      setLogsState(nextState.logs);
      setActiveLogState(nextState.activeLog);

      events.forEach(evt => {
        pushToApi(evt, evt.event === 'START' ? `Starting ${evt.log.id}` : `Terminating ${evt.log.id}`);
      });
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to start timer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopTimer = async (specificProjectId?: string) => {
    try {
      setIsLoading(true);
      setRepositoryError(null);
      await ensureSeeded();
      const { state: nextState, events } = await repository.stopTimer(specificProjectId);

      setLogsState(nextState.logs);
      setActiveLogState(nextState.activeLog);

      events.forEach(evt => {
        pushToApi(evt, `Terminating ${evt.log.id}`);
      });
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to stop timer');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetLocalStorage = async () => {
    try {
      isResetting.current = true;
      setIsLoading(true);
      setRepositoryError(null);
      await repository.reset();
      dm.clearState();
      window.location.reload();
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to reset storage');
    } finally {
      setIsLoading(false);
    }
  };

  const setProjects = async (action: React.SetStateAction<Project[]>) => {
    try {
      setRepositoryError(null);
      await ensureSeeded();
      const resolved = typeof action === 'function' ? action(projects) : action;
      const nextState = await repository.overrideState({ projects: resolved });
      setProjectsState(nextState.projects);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to set projects');
    }
  };

  const setTasks = async (action: React.SetStateAction<Task[]>) => {
    try {
      setRepositoryError(null);
      await ensureSeeded();
      const resolved = typeof action === 'function' ? action(tasks) : action;
      const nextState = await repository.overrideState({ tasks: resolved });
      setTasksState(nextState.tasks);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to set tasks');
    }
  };

  const setLogs = async (action: React.SetStateAction<TimeLog[]>) => {
    try {
      setRepositoryError(null);
      await ensureSeeded();
      const resolved = typeof action === 'function' ? action(logs) : action;
      const nextState = await repository.overrideState({ logs: resolved });
      setLogsState(nextState.logs);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to set logs');
    }
  };

  const setActiveLog = async (action: React.SetStateAction<TimeLog | null>) => {
    try {
      setRepositoryError(null);
      await ensureSeeded();
      const resolved = typeof action === 'function' ? action(activeLog) : action;
      const nextState = await repository.overrideState({ activeLog: resolved });
      setActiveLogState(nextState.activeLog);
    } catch (err: any) {
      setRepositoryError(err.message || 'Failed to set active log');
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
    handleResetLocalStorage,
  };
};

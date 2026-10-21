import { createContext, useContext } from 'react';
import { useTimeLogData } from './useTimeLogData';
import { ContextException } from '../exceptions';

export type DataState = ReturnType<typeof useTimeLogData>;

export interface ProjectsState {
  projects: DataState['projects'];
  setProjects: DataState['setProjects'];
  handleAddProject: DataState['handleAddProject'];
  handleToggleProjectArchive: DataState['handleToggleProjectArchive'];
  handleUpdateProject: DataState['handleUpdateProject'];
  handleRenameProject: DataState['handleRenameProject'];
}

export interface TasksState {
  tasks: DataState['tasks'];
  setTasks: DataState['setTasks'];
  selectedTaskId: DataState['selectedTaskId'];
  setSelectedTaskId: DataState['setSelectedTaskId'];
  handleAddTask: DataState['handleAddTask'];
  handleUpdateTask: DataState['handleUpdateTask'];
  handleRenameTask: DataState['handleRenameTask'];
  handleDeleteTask: DataState['handleDeleteTask'];
  handleToggleTaskComplete: DataState['handleToggleTaskComplete'];
}

export interface TimerState {
  logs: DataState['logs'];
  setLogs: DataState['setLogs'];
  activeLog: DataState['activeLog'];
  setActiveLog: DataState['setActiveLog'];
  handleStartTimer: DataState['handleStartTimer'];
  handleStopTimer: DataState['handleStopTimer'];
  handleEditTimeLog: DataState['handleEditTimeLog'];
  handleDeleteTimeLog: DataState['handleDeleteTimeLog'];
  handleInsertTimeLog: DataState['handleInsertTimeLog'];
}

export interface HolidaysState {
  holidays: DataState['holidays'];
  setHolidays: DataState['setHolidays'];
  handleAddHoliday: DataState['handleAddHoliday'];
  handleUpdateHoliday: DataState['handleUpdateHoliday'];
  handleDeleteHoliday: DataState['handleDeleteHoliday'];
}

export interface PatchesState {
  patches: DataState['patches'];
  setPatches: DataState['setPatches'];
}

export interface DataLifecycleState {
  isInitialized: DataState['isInitialized'];
  setIsInitialized: DataState['setIsInitialized'];
  isLoading: DataState['isLoading'];
  repositoryError: DataState['repositoryError'];
  engineState: DataState['engineState'];
  setEngineState: DataState['setEngineState'];
  handleResetLocalStorage: DataState['handleResetLocalStorage'];
  handleRestoreState: DataState['handleRestoreState'];
}

export const DataContext = createContext<DataState | undefined>(undefined);

export const useData = (): DataState => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new ContextException('useData must be used within DataProvider', 'ERR_DATA_CONTEXT');
  return ctx;
};

export const useProjects = (): ProjectsState => {
  const data = useData();
  return {
    projects: data.projects,
    setProjects: data.setProjects,
    handleAddProject: data.handleAddProject,
    handleToggleProjectArchive: data.handleToggleProjectArchive,
    handleUpdateProject: data.handleUpdateProject,
    handleRenameProject: data.handleRenameProject,
  };
};

export const useTasks = (): TasksState => {
  const data = useData();
  return {
    tasks: data.tasks,
    setTasks: data.setTasks,
    selectedTaskId: data.selectedTaskId,
    setSelectedTaskId: data.setSelectedTaskId,
    handleAddTask: data.handleAddTask,
    handleUpdateTask: data.handleUpdateTask,
    handleRenameTask: data.handleRenameTask,
    handleDeleteTask: data.handleDeleteTask,
    handleToggleTaskComplete: data.handleToggleTaskComplete,
  };
};

export const useTimer = (): TimerState => {
  const data = useData();
  return {
    logs: data.logs,
    setLogs: data.setLogs,
    activeLog: data.activeLog,
    setActiveLog: data.setActiveLog,
    handleStartTimer: data.handleStartTimer,
    handleStopTimer: data.handleStopTimer,
    handleEditTimeLog: data.handleEditTimeLog,
    handleDeleteTimeLog: data.handleDeleteTimeLog,
    handleInsertTimeLog: data.handleInsertTimeLog,
  };
};

export const useDataSafe = (): DataState | null => useContext(DataContext) ?? null;

export const useTasksSafe = (): TasksState | null => {
  const data = useDataSafe();
  if (!data) return null;
  return {
    tasks: data.tasks,
    setTasks: data.setTasks,
    selectedTaskId: data.selectedTaskId,
    setSelectedTaskId: data.setSelectedTaskId,
    handleAddTask: data.handleAddTask,
    handleUpdateTask: data.handleUpdateTask,
    handleRenameTask: data.handleRenameTask,
    handleDeleteTask: data.handleDeleteTask,
    handleToggleTaskComplete: data.handleToggleTaskComplete,
  };
};

export const useTimerSafe = (): TimerState | null => {
  const data = useDataSafe();
  if (!data) return null;
  return {
    logs: data.logs,
    setLogs: data.setLogs,
    activeLog: data.activeLog,
    setActiveLog: data.setActiveLog,
    handleStartTimer: data.handleStartTimer,
    handleStopTimer: data.handleStopTimer,
    handleEditTimeLog: data.handleEditTimeLog,
    handleDeleteTimeLog: data.handleDeleteTimeLog,
    handleInsertTimeLog: data.handleInsertTimeLog,
  };
};

export const useHolidays = (): HolidaysState => {
  const data = useData();
  return {
    holidays: data.holidays,
    setHolidays: data.setHolidays,
    handleAddHoliday: data.handleAddHoliday,
    handleUpdateHoliday: data.handleUpdateHoliday,
    handleDeleteHoliday: data.handleDeleteHoliday,
  };
};

export const usePatches = (): PatchesState => {
  const data = useData();
  return {
    patches: data.patches,
    setPatches: data.setPatches,
  };
};

export const useDataLifecycleState = (): DataLifecycleState => {
  const data = useData();
  return {
    isInitialized: data.isInitialized,
    setIsInitialized: data.setIsInitialized,
    isLoading: data.isLoading,
    repositoryError: data.repositoryError,
    engineState: data.engineState,
    setEngineState: data.setEngineState,
    handleResetLocalStorage: data.handleResetLocalStorage,
    handleRestoreState: data.handleRestoreState,
  };
};

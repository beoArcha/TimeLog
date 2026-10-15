import React, { createContext, useContext } from 'react';
import { useTimeLogData } from './useTimeLogData';
import { useSettings } from './SettingsContext';
import { ContextException } from '../exceptions';

export type DataState = ReturnType<typeof useTimeLogData>;

export const DataContext = createContext<DataState | undefined>(undefined);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new ContextException('useData must be used within DataProvider', 'ERR_DATA_CONTEXT');
  return ctx;
};

export const useProjects = () => {
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

export const useTasks = () => {
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

export const useTimer = () => {
  const data = useData();
  return {
    logs: data.logs,
    setLogs: data.setLogs,
    activeLog: data.activeLog,
    setActiveLog: data.setActiveLog,
    handleStartTimer: data.handleStartTimer,
    handleStopTimer: data.handleStopTimer,
    handleEditTimeLog: data.handleEditTimeLog,
  };
};

export const useHolidays = () => {
  const data = useData();
  return {
    holidays: data.holidays,
    setHolidays: data.setHolidays,
    handleAddHoliday: data.handleAddHoliday,
    handleDeleteHoliday: data.handleDeleteHoliday,
  };
};

export const usePatches = () => {
  const data = useData();
  return {
    patches: data.patches,
    setPatches: data.setPatches,
  };
};

export const useDataLifecycleState = () => {
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { pushToApi } = useSettings();
  const state = useTimeLogData(pushToApi);
  return <DataContext.Provider value={state}>{children}</DataContext.Provider>;
};

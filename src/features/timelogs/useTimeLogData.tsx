import { useState, useEffect } from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { PatchLog } from '@bindings/PatchLog';
import { LocalStorageDataManager } from '@core/data/dataManager';
import { STORAGE_KEYS } from '@common/constants';
import { DEFAULT_HOLIDAYS, INIT_PROJECTS, INIT_TASKS, INIT_LOGS } from './initialData';

const dm = new LocalStorageDataManager(STORAGE_KEYS.STATE_DB);

export type ApiPayload = { event: string; log: TimeLog | (TimeLog & { endTime: string }) };

export const useTimeLogData = (pushToApi: (payload: ApiPayload, logMsg: string) => void) => {
  const [projects, setProjects] = useState<Project[]>(() => dm.loadState()?.projects ?? INIT_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(() => dm.loadState()?.tasks ?? INIT_TASKS);
  const [logs, setLogs] = useState<TimeLog[]>(() => dm.loadState()?.logs ?? INIT_LOGS);
  const [activeLog, setActiveLog] = useState<TimeLog | null>(() => dm.loadState()?.activeLog ?? null);
  const [holidays, setHolidays] = useState<HolidayLeave[]>(() => dm.loadState()?.holidays ?? DEFAULT_HOLIDAYS);
  const [patches, setPatches] = useState<PatchLog[]>(() => dm.loadState()?.patches ?? []);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    () => dm.loadState()?.tasks?.[0]?.id ?? (INIT_TASKS[1]?.id ?? null)
  );

  const [isInitialized, setIsInitialized] = useState<boolean>(true);
  const [engineState, setEngineState] = useState<'searching' | 'connected'>('connected');
  const [enginePID, setEnginePID] = useState<number>(() => Math.floor(2500 + Math.random() * 5000));

  useEffect(() => {
    if (isInitialized) {
      dm.saveState({ projects, tasks, logs, activeLog, holidays, patches });
    }
  }, [projects, tasks, logs, activeLog, holidays, patches, isInitialized]);

  useEffect(() => {
    if (projects.length > 0 && engineState === 'searching') {
      const timer = setTimeout(() => {
        setEngineState('connected');
        setEnginePID(Math.floor(2000 + Math.random() * 7000));
        const runningLogs = logs.filter(l => l.endTime === null);
        if (runningLogs.length > 0) {
          setActiveLog(runningLogs[runningLogs.length - 1]);
        }
      }, 1100);
      return () => clearTimeout(timer);
    }
  }, [projects, logs, engineState]);

  const handleAddProject = (name: string, color: string) => {
    const newProj: Project = {
      id: dm.getNextId(projects),
      name,
      color,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    setProjects(prev => [...prev, newProj]);
  };

  const handleToggleProjectArchive = (projectId: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, archived: !p.archived } : p));
  };

  const handleAddTask = (projectId: string, name: string, parentTaskId: string | null) => {
    const newTask: Task = {
      id: dm.getNextId(tasks),
      projectId,
      parentTaskId,
      name,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
  };

  const handleRenameTask = (taskId: string, newName: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, name: newName } : t));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => {
      const toDelete = new Set([taskId]);
      prev.forEach(t => { if (t.parentTaskId === taskId) toDelete.add(t.id); });
      return prev.filter(t => !toDelete.has(t.id));
    });
    setLogs(prev => prev.filter(l => l.taskId !== taskId && !tasks.find(t => t.parentTaskId === taskId && t.id === l.taskId)));
    if (activeLog && (activeLog.taskId === taskId || tasks.find(t => t.parentTaskId === taskId && t.id === activeLog.taskId))) {
      setActiveLog(null);
    }
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        if (nextCompleted) {
          setLogs(curr => curr.map(l => l.taskId === taskId && l.endTime === null ? { ...l, endTime: new Date().toISOString() } : l));
          if (activeLog?.taskId === taskId) setActiveLog(null);
        }
        return { ...t, completed: nextCompleted };
      }
      return t;
    }));
  };

  const handleStartTimer = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isRunning = logs.some(l => l.taskId === taskId && l.endTime === null);
    if (isRunning) {
      setLogs(curr => curr.map(l => {
        if (l.taskId === taskId && l.endTime === null) {
          const stopObj = { ...l, endTime: new Date().toISOString() };
          pushToApi({ event: 'TERMINATE', log: stopObj }, `Terminating ${l.id}`);
          return stopObj;
        }
        return l;
      }));
      if (activeLog?.taskId === taskId) setActiveLog(null);
      return;
    }

    const parentId = task.parentTaskId;
    const updated = logs.map(l => {
      if (l.endTime === null) {
        if (parentId && l.taskId === parentId) return l;
        const stopObj = { ...l, endTime: new Date().toISOString() };
        pushToApi({ event: 'TERMINATE', log: stopObj }, `Terminating ${l.id}`);
        return stopObj;
      }
      return l;
    });

    const newLog: TimeLog = {
      id: dm.getNextId(logs, 'log_'),
      taskId,
      projectId: task.projectId,
      startTime: new Date().toISOString(),
      endTime: null,
    };
    pushToApi({ event: 'START', log: newLog }, `Starting ${newLog.id}`);

    let nextLogs = [...updated, newLog];
    if (parentId) {
      const isParentRunning = nextLogs.some(l => l.taskId === parentId && l.endTime === null);
      if (!isParentRunning) {
        const parentTask = tasks.find(t => t.id === parentId);
        if (parentTask) {
          const parentLog: TimeLog = {
            id: dm.getNextId(nextLogs, 'log_m_'),
            taskId: parentId,
            projectId: parentTask.projectId,
            startTime: new Date().toISOString(),
            endTime: null,
          };
          pushToApi({ event: 'START', log: parentLog }, `Starting Mother Task ${parentLog.id}`);
          nextLogs = [...nextLogs, parentLog];
        }
      }
    }
    setLogs(nextLogs);
    setActiveLog(newLog);
  };

  const handleStopTimer = (specificProjectId?: string) => {
    setLogs(curr => curr.map(l => {
      if (l.endTime === null && (!specificProjectId || l.projectId === specificProjectId)) {
        const stopObj = { ...l, endTime: new Date().toISOString() };
        pushToApi({ event: 'TERMINATE', log: stopObj }, `Terminating ${l.id}`);
        return stopObj;
      }
      return l;
    }));
    if (activeLog && (!specificProjectId || activeLog.projectId === specificProjectId)) {
      setActiveLog(null);
    }
  };

  const handleResetLocalStorage = () => {
    dm.clearState();
    window.location.reload();
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

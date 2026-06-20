import { useState, useEffect } from 'react';
import { Project, Task, TimeLog, HolidayLeave, PatchLog } from '../types';
import { DataManager } from '../utils/dataManager';
import { STORAGE_KEYS } from '../common/constants';

const LOCAL_STORAGE_KEY = STORAGE_KEYS.STATE_DB;

type ApiPayload = { event: string; log: TimeLog | (TimeLog & { endTime: string }) };

const DEFAULT_HOLIDAYS: HolidayLeave[] = [
  { id: 'h1', date: '2026-01-01', type: 'holiday', name: 'Nowy Rok (New Year)' },
  { id: 'h2', date: '2026-05-01', type: 'holiday', name: 'Święto Pracy (Labour Day)' },
  { id: 'h3', date: '2026-05-03', type: 'holiday', name: 'Święto Konstytucji 3 Maja' },
  { id: 'h4', date: '2026-06-04', type: 'holiday', name: 'Boże Ciało (Corpus Christi)' },
  { id: 'h5', date: '2026-11-11', type: 'holiday', name: 'Święto Niepodległości (Independence Day)' },
  { id: 'h6', date: '2026-12-25', type: 'holiday', name: 'Boże Narodzenie (Christmas)' },
  { id: 'l1', date: '2026-06-15', type: 'leave', name: 'Urlop wypoczynkowy (Zouk Dance Camp)' },
  { id: 'l2', date: '2026-06-16', type: 'leave', name: 'Urlop wypoczynkowy (Kizomba Festival)' },
  { id: 'l3', date: '2026-06-17', type: 'leave', name: 'Urlop wypoczynkowy (Bachata & Salsa NY)' },
];

const INIT_PROJECTS: Project[] = [
  { id: '1', name: 'LogTime by OxyFlow Backend Engine', color: 'violet', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
  { id: '2', name: 'Zouk Flow UI System', color: 'rose', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
  { id: '3', name: 'CLI Daemon Integration', color: 'teal', createdAt: new Date().toISOString() },
];

const INIT_TASKS: Task[] = [
  { id: '101', projectId: '1', parentTaskId: null, name: 'Setup sqlite schema state machine', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), completed: true },
  { id: '102', projectId: '1', parentTaskId: null, name: 'Develop recursive calculations for project logging', createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), completed: false },
  { id: '1021', projectId: '1', parentTaskId: '102', name: 'Unit test nested hierarchical timings', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), completed: false },
  { id: '1022', projectId: '1', parentTaskId: '102', name: 'Optimize microORM connection pooling', createdAt: new Date().toISOString(), completed: true },
  { id: '201', projectId: '2', parentTaskId: null, name: 'Create glowing time display component', createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), completed: false },
  { id: '202', projectId: '2', parentTaskId: null, name: 'Integrate dynamic wave animations', createdAt: new Date().toISOString(), completed: true },
  { id: '301', projectId: '3', parentTaskId: null, name: 'Map help guidelines onto interactive commands', createdAt: new Date().toISOString(), completed: false },
];

const INIT_LOGS: TimeLog[] = [
  { id: 'l1', taskId: '101', projectId: '1', startTime: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 4800000).toISOString() },
  { id: 'l2', taskId: '1022', projectId: '1', startTime: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), endTime: new Date(Date.now() - 1 * 24 * 3600 * 1000 + 2900000).toISOString() },
  { id: 'l3', taskId: '202', projectId: '2', startTime: new Date().toISOString(), endTime: new Date(Date.now() + 1800000).toISOString() },
];

function loadSavedState() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (err) {
      console.warn('Failed parsing local LogTime by OxyFlow store', err);
    }
  }
  return null;
}

export const useTimeLogData = (pushToApi: (payload: ApiPayload, logMsg: string) => void) => {
  const [projects, setProjects] = useState<Project[]>(() => loadSavedState()?.projects ?? INIT_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(() => loadSavedState()?.tasks ?? INIT_TASKS);
  const [logs, setLogs] = useState<TimeLog[]>(() => loadSavedState()?.logs ?? INIT_LOGS);
  const [activeLog, setActiveLog] = useState<TimeLog | null>(() => loadSavedState()?.activeLog ?? null);
  const [holidays, setHolidays] = useState<HolidayLeave[]>(() => loadSavedState()?.holidays ?? DEFAULT_HOLIDAYS);
  const [patches, setPatches] = useState<PatchLog[]>(() => loadSavedState()?.patches ?? []);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(
    () => loadSavedState()?.tasks?.[0]?.id ?? (INIT_TASKS[1]?.id ?? null)
  );

  const [isInitialized, setIsInitialized] = useState<boolean>(true);
  const [engineState, setEngineState] = useState<'searching' | 'connected'>('connected');
  const [enginePID, setEnginePID] = useState<number>(() => Math.floor(2500 + Math.random() * 5000));


  useEffect(() => {
    if (isInitialized) {
      const stateObj = { projects, tasks, logs, activeLog, holidays, patches };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateObj));
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
      id: DataManager.getNextId(projects),
      name,
      color,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    setProjects(prev => [...prev, newProj]);
  };

  const handleToggleProjectArchive = (projectId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, archived: !p.archived };
      }
      return p;
    }));
  };

  const handleAddTask = (projectId: string, name: string, parentTaskId: string | null) => {
    const nextId = DataManager.getNextId(tasks);
    const newTask: Task = {
      id: nextId,
      projectId,
      parentTaskId,
      name,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, name: newName };
      }
      return p;
    }));
  };

  const handleRenameTask = (taskId: string, newName: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, name: newName };
      }
      return t;
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => {
      const tasksToDelete = new Set([taskId]);
      prev.forEach(t => {
        if (t.parentTaskId === taskId) {
          tasksToDelete.add(t.id);
        }
      });
      return prev.filter(t => !tasksToDelete.has(t.id));
    });
    setLogs(prev => prev.filter(l => l.taskId !== taskId && !tasks.find(t => t.parentTaskId === taskId && t.id === l.taskId)));
    if (activeLog && (activeLog.taskId === taskId || tasks.find(t => t.parentTaskId === taskId && t.id === activeLog.taskId))) {
      setActiveLog(null);
    }
  };

  const handleToggleTaskComplete = (taskId: string) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === taskId) {
          const updatedState = !t.completed;
          if (updatedState) {
            setLogs(currLogs =>
              currLogs.map(l => {
                if (l.taskId === taskId && l.endTime === null) {
                  return { ...l, endTime: new Date().toISOString() };
                }
                return l;
              })
            );
            if (activeLog && activeLog.taskId === taskId) {
              setActiveLog(null);
            }
          }
          return { ...t, completed: updatedState };
        }
        return t;
      })
    );
  };

  const handleStartTimer = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const isCurrentlyRunning = logs.some(l => l.taskId === taskId && l.endTime === null);
    if (isCurrentlyRunning) {
      setLogs(currLogs =>
        currLogs.map(l => {
          if (l.taskId === taskId && l.endTime === null) {
            const payloadStop = { event: 'TERMINATE', log: { ...l, endTime: new Date().toISOString() } };
            pushToApi(payloadStop, `Terminating ${l.id}`);
            return { ...l, endTime: new Date().toISOString() };
          }
          return l;
        })
      );
      if (activeLog?.taskId === taskId) {
        setActiveLog(null);
      }
      return;
    }

    const motherTaskId = task.parentTaskId;

    const updatedLogs = logs.map(l => {
      if (l.endTime === null) {
        if (motherTaskId && l.taskId === motherTaskId) {
          return l;
        }
        const payload = { event: 'TERMINATE', log: { ...l, endTime: new Date().toISOString() } };
        pushToApi(payload, `Terminating ${l.id}`);
        return { ...l, endTime: new Date().toISOString() };
      }
      return l;
    });

    const newLog: TimeLog = {
      id: DataManager.getNextId(logs, 'log_'),
      taskId,
      projectId: task.projectId,
      startTime: new Date().toISOString(),
      endTime: null,
    };
    const payloadStart = { event: 'START', log: newLog };
    pushToApi(payloadStart, `Starting ${newLog.id}`);

    let logsToSet = [...updatedLogs, newLog];

    let motherLog: TimeLog | undefined;
    if (motherTaskId) {
      const isMotherRunning = logsToSet.some(l => l.taskId === motherTaskId && l.endTime === null);
      if (!isMotherRunning) {
        const motherTask = tasks.find(t => t.id === motherTaskId);
        if (motherTask) {
          motherLog = {
            id: DataManager.getNextId(logsToSet, 'log_m_'),
            taskId: motherTaskId,
            projectId: motherTask.projectId,
            startTime: new Date().toISOString(),
            endTime: null,
          };
          const payloadStartM = { event: 'START', log: motherLog };
          pushToApi(payloadStartM, `Starting Mother Task ${motherLog.id}`);
          logsToSet = [...logsToSet, motherLog];
        }
      }
    }

    setLogs(logsToSet);
    setActiveLog(newLog);
  };

  const handleStopTimer = (specificProjectId?: string) => {
    setLogs(currLogs =>
      currLogs.map(l => {
        if (l.endTime === null && (!specificProjectId || l.projectId === specificProjectId)) {
          const payloadStop = { event: 'TERMINATE', log: { ...l, endTime: new Date().toISOString() } };
          pushToApi(payloadStop, `Terminating ${l.id}`);
          return { ...l, endTime: new Date().toISOString() };
        }
        return l;
      })
    );

    if (activeLog && (!specificProjectId || activeLog.projectId === specificProjectId)) {
      setActiveLog(null);
    }
  };

  const handleResetLocalStorage = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
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

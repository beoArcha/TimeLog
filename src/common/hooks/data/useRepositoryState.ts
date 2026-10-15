import { useState } from 'react';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';

export const useRepositoryState = () => {
  const [projects, setProjectsState] = useState<Project[]>([]);
  const [tasks, setTasksState] = useState<Task[]>([]);
  const [logs, setLogsState] = useState<TimeLog[]>([]);
  const [activeLog, setActiveLogState] = useState<TimeLog | null>(null);

  const syncRepositoryState = (nextState: Partial<TimerRepositoryState>) => {
    if (nextState.projects !== undefined) setProjectsState(nextState.projects);
    if (nextState.tasks !== undefined) setTasksState(nextState.tasks);
    if (nextState.logs !== undefined) setLogsState(nextState.logs);
    if (nextState.activeLog !== undefined) setActiveLogState(nextState.activeLog);
  };

  return {
    projects,
    setProjectsState,
    tasks,
    setTasksState,
    logs,
    setLogsState,
    activeLog,
    setActiveLogState,
    syncRepositoryState,
  };
};

export type RepositoryStateHook = ReturnType<typeof useRepositoryState>;

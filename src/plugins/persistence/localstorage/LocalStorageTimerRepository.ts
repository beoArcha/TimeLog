import { TimerRepository, TimerRepositoryState, ApiPayload } from '../RepositoryTypes';
import { STORAGE_KEYS } from '@common/constants';
import { LocalStorageDataManager } from '@plugins/persistence/dataManager';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';

export class LocalStorageTimerRepository implements TimerRepository {
  private getRawState(): Record<string, unknown> {
    const stored = localStorage.getItem(STORAGE_KEYS.STATE_DB);
    if (!stored) return {};
    try {
      return JSON.parse(stored) as Record<string, unknown>;
    } catch (err) {
      console.warn('Failed parsing local LogTime by OxyFlow store', err);
      return {};
    }
  }

  private saveRawState(state: Record<string, unknown>): void {
    localStorage.setItem(STORAGE_KEYS.STATE_DB, JSON.stringify(state));
  }

  async load(): Promise<TimerRepositoryState | null> {
    const raw = this.getRawState() as Partial<TimerRepositoryState> & Record<string, unknown>;
    if (raw.projects === undefined && raw.tasks === undefined && raw.logs === undefined) {
      return null;
    }
    return {
      projects: raw.projects ?? [],
      tasks: raw.tasks ?? [],
      logs: raw.logs ?? [],
      activeLog: raw.activeLog ?? null,
    };
  }

  async overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    const raw = this.getRawState() as Partial<TimerRepositoryState> & Record<string, unknown>;
    const updated: Record<string, unknown> = {
      ...raw,
      ...(state.projects !== undefined && { projects: state.projects }),
      ...(state.tasks !== undefined && { tasks: state.tasks }),
      ...(state.logs !== undefined && { logs: state.logs }),
      ...(state.activeLog !== undefined && { activeLog: state.activeLog }),
    };
    this.saveRawState(updated);
    const updatedState = updated as Partial<TimerRepositoryState> & Record<string, unknown>;
    return {
      projects: updatedState.projects ?? [],
      tasks: updatedState.tasks ?? [],
      logs: updatedState.logs ?? [],
      activeLog: updatedState.activeLog ?? null,
    };
  }

  async addProject(input: { name: string; color: string }): Promise<TimerRepositoryState> {
    const currentState = await this.load() || { projects: [], tasks: [], logs: [], activeLog: null };
    const newProj: Project = {
      id: LocalStorageDataManager.getNextId(currentState.projects),
      name: input.name,
      color: input.color,
      createdAt: new Date().toISOString(),
      archived: false,
    };
    const nextProjects = [...currentState.projects, newProj];
    return this.overrideState({ projects: nextProjects });
  }

  async toggleProjectArchive(projectId: string): Promise<TimerRepositoryState> {
    const currentState = await this.load() || { projects: [], tasks: [], logs: [], activeLog: null };
    const nextProjects = currentState.projects.map(p =>
      p.id === projectId ? { ...p, archived: !p.archived } : p
    );
    return this.overrideState({ projects: nextProjects });
  }

  async addTask(input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState> {
    const currentState = await this.load() || { projects: [], tasks: [], logs: [], activeLog: null };
    const newTask: Task = {
      id: LocalStorageDataManager.getNextId(currentState.tasks),
      projectId: input.projectId,
      parentTaskId: input.parentTaskId ?? undefined,
      name: input.name,
      createdAt: new Date().toISOString(),
      completed: false,
    };
    const nextTasks = [...currentState.tasks, newTask];
    return this.overrideState({ tasks: nextTasks });
  }

  async renameProject(projectId: string, name: string): Promise<TimerRepositoryState> {
    const currentState = await this.load() || { projects: [], tasks: [], logs: [], activeLog: null };
    const nextProjects = currentState.projects.map(p =>
      p.id === projectId ? { ...p, name } : p
    );
    return this.overrideState({ projects: nextProjects });
  }

  async renameTask(taskId: string, name: string): Promise<TimerRepositoryState> {
    const currentState = await this.load() || { projects: [], tasks: [], logs: [], activeLog: null };
    const nextTasks = currentState.tasks.map(t =>
      t.id === taskId ? { ...t, name } : t
    );
    return this.overrideState({ tasks: nextTasks });
  }

  async deleteTask(taskId: string): Promise<TimerRepositoryState> {
    const currentState = await this.load() || { projects: [], tasks: [], logs: [], activeLog: null };
    const toDelete = new Set([taskId]);
    currentState.tasks.forEach(t => {
      if (t.parentTaskId === taskId) toDelete.add(t.id);
    });

    const nextTasks = currentState.tasks.filter(t => !toDelete.has(t.id));
    const nextLogs = currentState.logs.filter(l =>
      l.taskId !== taskId &&
      !currentState.tasks.find(t => t.parentTaskId === taskId && t.id === l.taskId)
    );

    let nextActiveLog = currentState.activeLog;
    if (
      currentState.activeLog &&
      (currentState.activeLog.taskId === taskId ||
        currentState.tasks.find(t => t.parentTaskId === taskId && t.id === currentState.activeLog!.taskId))
    ) {
      nextActiveLog = null;
    }

    return this.overrideState({
      tasks: nextTasks,
      logs: nextLogs,
      activeLog: nextActiveLog,
    });
  }

  async toggleTaskComplete(taskId: string): Promise<TimerRepositoryState> {
    const currentState = await this.load() || { projects: [], tasks: [], logs: [], activeLog: null };
    let nextActiveLog = currentState.activeLog;
    let nextLogs = currentState.logs;

    const nextTasks = currentState.tasks.map(t => {
      if (t.id === taskId) {
        const nextCompleted = !t.completed;
        if (nextCompleted) {
          nextLogs = currentState.logs.map(l =>
            l.taskId === taskId && (l.endTime === null || l.endTime === undefined)
              ? { ...l, endTime: new Date().toISOString() }
              : l
          );
          if (currentState.activeLog?.taskId === taskId) {
            nextActiveLog = null;
          }
        }
        return { ...t, completed: nextCompleted };
      }
      return t;
    });

    return this.overrideState({
      tasks: nextTasks,
      logs: nextLogs,
      activeLog: nextActiveLog,
    });
  }

  async startTimer(taskId: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }> {
    const currentState = await this.load() || { projects: [], tasks: [], logs: [], activeLog: null };
    const task = currentState.tasks.find(t => t.id === taskId);
    if (!task) {
      return { state: currentState, events: [] };
    }

    const events: ApiPayload[] = [];
    const isRunning = currentState.logs.some(l => l.taskId === taskId && (l.endTime === null || l.endTime === undefined));

    if (isRunning) {
      const nextLogs = currentState.logs.map(l => {
        if (l.taskId === taskId && (l.endTime === null || l.endTime === undefined)) {
          const stopObj = { ...l, endTime: new Date().toISOString() };
          events.push({ event: 'TERMINATE', log: stopObj });
          return stopObj;
        }
        return l;
      });
      const nextActiveLog = currentState.activeLog?.taskId === taskId ? null : currentState.activeLog;
      const state = await this.overrideState({ logs: nextLogs, activeLog: nextActiveLog });
      return { state, events };
    }

    const parentId = task.parentTaskId;
    const updatedLogs = currentState.logs.map(l => {
      if (l.endTime === null || l.endTime === undefined) {
        if (parentId && l.taskId === parentId) return l;
        const stopObj = { ...l, endTime: new Date().toISOString() };
        events.push({ event: 'TERMINATE', log: stopObj });
        return stopObj;
      }
      return l;
    });

    const newLog: TimeLog = {
      id: LocalStorageDataManager.getNextId(updatedLogs, 'log_'),
      taskId,
      projectId: task.projectId,
      startTime: new Date().toISOString(),
      endTime: null as any,
    };
    events.push({ event: 'START', log: newLog });

    let nextLogs = [...updatedLogs, newLog];
    if (parentId) {
      const isParentRunning = nextLogs.some(l => l.taskId === parentId && (l.endTime === null || l.endTime === undefined));
      if (!isParentRunning) {
        const parentTask = currentState.tasks.find(t => t.id === parentId);
        if (parentTask) {
          const parentLog: TimeLog = {
            id: LocalStorageDataManager.getNextId(nextLogs, 'log_m_'),
            taskId: parentId,
            projectId: parentTask.projectId,
            startTime: new Date().toISOString(),
            endTime: null as any,
          };
          events.push({ event: 'START', log: parentLog });
          nextLogs = [...nextLogs, parentLog];
        }
      }
    }

    const state = await this.overrideState({ logs: nextLogs, activeLog: newLog });
    return { state, events };
  }

  async stopTimer(projectId?: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }> {
    const currentState = await this.load() || { projects: [], tasks: [], logs: [], activeLog: null };
    const events: ApiPayload[] = [];
    const nextLogs = currentState.logs.map(l => {
      if ((l.endTime === null || l.endTime === undefined) && (!projectId || l.projectId === projectId)) {
        const stopObj = { ...l, endTime: new Date().toISOString() };
        events.push({ event: 'TERMINATE', log: stopObj });
        return stopObj;
      }
      return l;
    });

    let nextActiveLog = currentState.activeLog;
    if (currentState.activeLog && (!projectId || currentState.activeLog.projectId === projectId)) {
      nextActiveLog = null;
    }

    const state = await this.overrideState({ logs: nextLogs, activeLog: nextActiveLog });
    return { state, events };
  }

  async reset(): Promise<TimerRepositoryState> {
    const raw = this.getRawState();
    delete raw.projects;
    delete raw.tasks;
    delete raw.logs;
    delete raw.activeLog;
    this.saveRawState(raw);
    return {
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    };
  }
}

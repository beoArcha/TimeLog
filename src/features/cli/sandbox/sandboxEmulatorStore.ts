import { ErrorHandler, PersistenceException } from '@common/exceptions';
import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { CliEngineContext } from '../types';
import {
  createDemoProjects,
  createDemoTasks,
  createDemoLogs,
  createDemoHolidays,
} from './sandboxDemoData';
import { calculateSandboxMetrics } from './sandboxMetricsCalculator';
import { buildSandboxCliContext, ISandboxStoreBridge } from './sandboxContextBridge';

export const SANDBOX_STORAGE_KEY = 'oxy_cli_sandbox_state';

export interface SandboxPersistedState {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  holidays: HolidayLeave[];
  activeLog: TimeLog | null;
  selectedTaskId: string | null;
  nextIdCounter: number;
}

const readPersistedSandboxState = (): SandboxPersistedState | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(SANDBOX_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SandboxPersistedState;
    if (Array.isArray(parsed.projects) && Array.isArray(parsed.tasks)) {
      return parsed;
    }
    return null;
  } catch (err) {
    ErrorHandler.handle(
      new PersistenceException('Failed reading sandbox emulator state from localStorage', err, 'WARN_SANDBOX_READ', 'WARN')
    );
    return null;
  }
};

const savePersistedSandboxState = (state: SandboxPersistedState | null): void => {
  try {
    if (typeof localStorage === 'undefined') return;
    if (state) {
      localStorage.setItem(SANDBOX_STORAGE_KEY, JSON.stringify(state));
    } else {
      localStorage.removeItem(SANDBOX_STORAGE_KEY);
    }
  } catch (err) {
    ErrorHandler.handle(
      new PersistenceException('Failed saving sandbox emulator state to localStorage', err, 'ERR_SANDBOX_SAVE')
    );
  }
};

/**
 * In-memory state store for isolated learning and test workflows.
 * Guarantees zero side-effects to the real database or file persistence layer.
 */
export class SandboxEmulatorStore implements ISandboxStoreBridge {
  private static instance: SandboxEmulatorStore | null = null;

  private isSandboxEnabled = false;
  private projects: Project[] = [];
  private tasks: Task[] = [];
  private logs: TimeLog[] = [];
  private holidays: HolidayLeave[] = [];
  private activeLog: TimeLog | null = null;
  private selectedTaskId: string | null = null;
  private nextIdCounter = 100;

  private constructor() {
    this.init();
  }

  private init(): void {
    const saved = readPersistedSandboxState();
    if (saved) {
      this.projects = saved.projects;
      this.tasks = saved.tasks;
      this.logs = saved.logs;
      this.holidays = saved.holidays;
      this.activeLog = saved.activeLog;
      this.selectedTaskId = saved.selectedTaskId;
      this.nextIdCounter = saved.nextIdCounter ?? 100;
      return;
    }
    this.reset();
  }

  public static getInstance(): SandboxEmulatorStore {
    if (!SandboxEmulatorStore.instance) {
      SandboxEmulatorStore.instance = new SandboxEmulatorStore();
    }
    return SandboxEmulatorStore.instance;
  }

  public static resetInstanceForTesting(): void {
    savePersistedSandboxState(null);
    SandboxEmulatorStore.instance = new SandboxEmulatorStore();
  }

  public enable(): void {
    this.isSandboxEnabled = true;
  }

  public disable(): void {
    this.isSandboxEnabled = false;
  }

  public isActive(): boolean {
    return this.isSandboxEnabled;
  }

  public reset(): void {
    savePersistedSandboxState(null);
    this.projects = createDemoProjects();
    this.tasks = createDemoTasks();
    this.logs = createDemoLogs();
    this.holidays = createDemoHolidays();
    this.activeLog = null;
    this.selectedTaskId = 'sb_t1';
    this.nextIdCounter = 100;
  }

  private persist(): void {
    savePersistedSandboxState({
      projects: this.projects,
      tasks: this.tasks,
      logs: this.logs,
      holidays: this.holidays,
      activeLog: this.activeLog,
      selectedTaskId: this.selectedTaskId,
      nextIdCounter: this.nextIdCounter,
    });
  }

  public getProjects(): Project[] {
    return [...this.projects];
  }

  public getTasks(): Task[] {
    return [...this.tasks];
  }

  public getLogs(): TimeLog[] {
    return [...this.logs];
  }

  public getHolidays(): HolidayLeave[] {
    return [...this.holidays];
  }

  public getActiveLog(): TimeLog | null {
    return this.activeLog;
  }

  public getSelectedTaskId(): string | null {
    return this.selectedTaskId;
  }

  public setSelectedTaskId(id: string | null): void {
    this.selectedTaskId = id;
    this.persist();
  }

  public setHolidays(updater: HolidayLeave[] | ((prev: HolidayLeave[]) => HolidayLeave[])): void {
    if (typeof updater === 'function') {
      this.holidays = updater(this.holidays);
    } else {
      this.holidays = updater;
    }
    this.persist();
  }

  public handleAddProject(name: string, color = 'indigo'): Project {
    const id = `sb_p${++this.nextIdCounter}`;
    const newProject: Project = {
      id,
      name,
      color,
      createdAt: new Date().toISOString(),
      archived: false,
      description: null,
      icon: null,
      tags: null,
    };
    this.projects.push(newProject);
    this.persist();
    return newProject;
  }

  public handleRenameProject(projectId: string, newName: string): boolean {
    const proj = this.projects.find((p) => p.id === projectId);
    if (!proj) return false;
    proj.name = newName;
    this.persist();
    return true;
  }

  public handleAddTask(projectId: string, name: string, parentTaskId: string | null = null): Task {
    const id = `sb_t${++this.nextIdCounter}`;
    const newTask: Task = {
      id,
      projectId,
      name,
      completed: false,
      createdAt: new Date().toISOString(),
      status: null,
      parentTaskId,
    };
    this.tasks.push(newTask);
    this.persist();
    return newTask;
  }

  public handleRenameTask(taskId: string, newName: string): boolean {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return false;
    task.name = newName;
    this.persist();
    return true;
  }

  public handleToggleTaskComplete(taskId: string): boolean {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return false;
    task.completed = !task.completed;
    this.persist();
    return true;
  }

  public handleStartTimer(taskId: string, nowIso?: string): TimeLog {
    if (this.activeLog) {
      this.handleStopTimer(undefined, nowIso);
    }
    const task = this.tasks.find((t) => t.id === taskId);
    const projectId = task?.projectId ?? 'sb_p1';
    const startTime = nowIso || new Date().toISOString();
    const id = `sb_l${++this.nextIdCounter}`;

    const newLog: TimeLog = {
      id,
      taskId,
      projectId,
      startTime,
      endTime: null,
      note: null,
      editHistory: null,
    };
    this.logs.push(newLog);
    this.activeLog = newLog;
    this.selectedTaskId = taskId;
    this.persist();
    return newLog;
  }

  public handleStopTimer(_projectId?: string, nowIso?: string): void {
    if (!this.activeLog) return;
    const endTime = nowIso || new Date().toISOString();
    this.activeLog.endTime = endTime;
    const idx = this.logs.findIndex((l) => l.id === this.activeLog?.id);
    if (idx !== -1) {
      this.logs[idx] = { ...this.activeLog };
    }
    this.activeLog = null;
    this.persist();
  }

  public getComputedMetrics(nowIso?: string): EngineComputedMetrics {
    return calculateSandboxMetrics(this.projects, this.tasks, this.logs, nowIso);
  }

  public toCliContext(baseContext: CliEngineContext): CliEngineContext {
    return buildSandboxCliContext(this, baseContext);
  }
}

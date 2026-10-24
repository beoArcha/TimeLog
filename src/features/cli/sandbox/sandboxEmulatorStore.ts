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
import {
  SANDBOX_STORAGE_KEY,
  SandboxPersistedState,
  readPersistedSandboxState,
  savePersistedSandboxState,
} from './store/sandboxStorage';
import {
  addProjectOp,
  renameProjectOp,
  archiveProjectOp,
} from './store/sandboxProjectOps';
import {
  addTaskOp,
  renameTaskOp,
  toggleTaskCompleteOp,
  archiveTaskOp,
  reparentTaskOp,
  moveTaskOp,
} from './store/sandboxTaskOps';
import {
  addLogOp,
  removeLogOp,
  startTimerOp,
  stopTimerOp,
  switchTimerOp,
} from './store/sandboxTimerOps';

export { SANDBOX_STORAGE_KEY };
export type { SandboxPersistedState };

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
    const project = addProjectOp(this.projects, `sb_p${++this.nextIdCounter}`, name, color);
    this.persist();
    return project;
  }

  public handleRenameProject(projectId: string, newName: string, color?: string): boolean {
    const success = renameProjectOp(this.projects, projectId, newName, color);
    if (success) this.persist();
    return success;
  }

  public handleArchiveProject(projectId: string): boolean {
    const success = archiveProjectOp(this.projects, projectId);
    if (success) this.persist();
    return success;
  }

  public handleAddTask(projectId: string, name: string, parentTaskId: string | null = null): Task {
    const task = addTaskOp(this.tasks, `sb_t${++this.nextIdCounter}`, projectId, name, parentTaskId);
    this.persist();
    return task;
  }

  public handleRenameTask(taskId: string, newName: string): boolean {
    const success = renameTaskOp(this.tasks, taskId, newName);
    if (success) this.persist();
    return success;
  }

  public handleToggleTaskComplete(taskId: string): boolean {
    const success = toggleTaskCompleteOp(this.tasks, taskId);
    if (success) this.persist();
    return success;
  }

  public handleArchiveTask(taskId: string): boolean {
    const success = archiveTaskOp(this.tasks, taskId);
    if (success) this.persist();
    return success;
  }

  public handleReparentTask(taskId: string, newParentId: string | null): boolean {
    const success = reparentTaskOp(this.tasks, taskId, newParentId);
    if (success) this.persist();
    return success;
  }

  public handleMoveTask(taskId: string, newProjectId: string): boolean {
    const success = moveTaskOp(this.tasks, taskId, newProjectId);
    if (success) this.persist();
    return success;
  }

  public handleAddLog(
    taskId: string,
    durationSeconds: number,
    note?: string | null,
    startTimeIso?: string
  ): TimeLog {
    const log = addLogOp(
      this.tasks,
      this.logs,
      `sb_l${++this.nextIdCounter}`,
      taskId,
      durationSeconds,
      note,
      startTimeIso
    );
    this.persist();
    return log;
  }

  public handleRemoveLog(logId: string): boolean {
    const success = removeLogOp(this.logs, logId);
    if (success) this.persist();
    return success;
  }

  public seedForTesting(state: {
    projects?: Project[];
    tasks?: Task[];
    logs?: TimeLog[];
    activeLog?: TimeLog | null;
    selectedTaskId?: string | null;
  }): void {
    savePersistedSandboxState(null);
    this.projects = state.projects ? [...state.projects] : [];
    this.tasks = state.tasks ? [...state.tasks] : [];
    this.logs = state.logs ? [...state.logs] : [];
    this.activeLog = state.activeLog !== undefined ? state.activeLog : null;
    this.selectedTaskId = state.selectedTaskId !== undefined ? state.selectedTaskId : null;
    this.nextIdCounter = 100;
    this.isSandboxEnabled = true;
  }

  public handleStartTimer(taskId: string, nowIso?: string): TimeLog {
    const newLog = startTimerOp(
      this.tasks,
      this.logs,
      this.activeLog,
      `sb_l${++this.nextIdCounter}`,
      taskId,
      nowIso
    );
    this.activeLog = newLog;
    this.selectedTaskId = taskId;
    this.persist();
    return newLog;
  }

  public handleStopTimer(_projectId?: string, nowIso?: string): { success: boolean; error?: string; errorCode?: string } {
    const result = stopTimerOp(this.logs, this.activeLog, nowIso);
    if (result.success) {
      this.activeLog = null;
      this.persist();
    }
    return result;
  }

  public handleSwitchTimer(newTaskId: string, nowIso?: string): TimeLog {
    const newLog = switchTimerOp(
      this.tasks,
      this.logs,
      this.activeLog,
      `sb_l${++this.nextIdCounter}`,
      newTaskId,
      nowIso
    );
    this.activeLog = newLog;
    this.selectedTaskId = newTaskId;
    this.persist();
    return newLog;
  }

  public getComputedMetrics(nowIso?: string): EngineComputedMetrics {
    return calculateSandboxMetrics(this.projects, this.tasks, this.logs, nowIso);
  }

  public toCliContext(baseContext: CliEngineContext): CliEngineContext {
    return buildSandboxCliContext(this, baseContext);
  }
}

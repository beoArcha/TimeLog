import { Project } from '@bindings/Project';
import { Task } from '@bindings/Task';
import { TimeLog } from '@bindings/TimeLog';
import { HolidayLeave } from '@bindings/HolidayLeave';
import { EngineComputedMetrics } from '@bindings/EngineComputedMetrics';
import { CliEngineContext } from '../types';

export interface ISandboxStoreBridge {
  getProjects(): Project[];
  getTasks(): Task[];
  getLogs(): TimeLog[];
  getHolidays(): HolidayLeave[];
  getActiveLog(): TimeLog | null;
  getSelectedTaskId(): string | null;
  setSelectedTaskId(id: string | null): void;
  handleAddProject(name: string, color?: string): Project;
  handleRenameProject(projectId: string, newName: string): boolean;
  handleAddTask(projectId: string, name: string, parentTaskId?: string | null): Task;
  handleRenameTask(taskId: string, newName: string): boolean;
  handleToggleTaskComplete(taskId: string): boolean;
  handleStartTimer(taskId: string, nowIso?: string): TimeLog;
  handleStopTimer(projectId?: string, nowIso?: string): void;
  setHolidays(updater: HolidayLeave[] | ((prev: HolidayLeave[]) => HolidayLeave[])): void;
  getComputedMetrics(nowIso?: string): EngineComputedMetrics;
}

/**
 * Builds an isolated CliEngineContext backed by the sandbox in-memory store.
 */
export const buildSandboxCliContext = (
  store: ISandboxStoreBridge,
  baseContext: CliEngineContext
): CliEngineContext => {
  return {
    ...baseContext,
    projects: store.getProjects(),
    tasks: store.getTasks(),
    logs: store.getLogs(),
    activeLog: store.getActiveLog(),
    holidays: store.getHolidays(),
    selectedTaskId: store.getSelectedTaskId(),
    metrics: store.getComputedMetrics(baseContext.nowIso),
    isSandbox: true,
    setSelectedTaskId: (id: string | null) => store.setSelectedTaskId(id),
    onAddProject: (name: string, color: string) => store.handleAddProject(name, color),
    onRenameProject: (projectId: string, name: string) => store.handleRenameProject(projectId, name),
    onAddTask: (projectId: string, name: string, parentTaskId: string | null) =>
      store.handleAddTask(projectId, name, parentTaskId),
    onRenameTask: (taskId: string, name: string) => store.handleRenameTask(taskId, name),
    onToggleTaskComplete: (taskId: string) => store.handleToggleTaskComplete(taskId),
    onStartTimer: (taskId: string) => store.handleStartTimer(taskId, baseContext.nowIso),
    onStopTimer: (projectId?: string) => store.handleStopTimer(projectId, baseContext.nowIso),
    setHolidays: (value) => store.setHolidays(value),
  };
};

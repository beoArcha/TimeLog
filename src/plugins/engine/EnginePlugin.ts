import { IEngine, CreateProjectInput, CreateTaskInput } from '@common/engine/IEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EntityNotFoundException, EngineException, ErrorHandler } from '@common/exceptions';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { TaskStatus } from '@bindings/TaskStatus';
import { Settings } from '@bindings/Settings';
import { RuntimeConfig } from '@bindings/RuntimeConfig';
import {
  calculateTaskElapsed,
  calculateProjectElapsed,
  calculateElapsedRange,
  computeAllMetrics,
  ElapsedRangeFilter,
  EngineComputedMetrics,
} from './elapsed';
import {
  validateProjectName,
  validateTaskName,
  validateTaskHierarchy,
  validateTimeLog,
} from './validation';

let logCounter = 0;


export class EnginePlugin implements IEngine {
  private persistence = PersistenceRouter.getInstance();

  // Timer Lifecycle
  async startTimer(taskId: string): Promise<void> {
    const projectId = await this.persistence.tasks.getProjectId(taskId);
    const now = new Date().toISOString();

    await this.persistence.timeLogs.closeActiveByProject(now, projectId);

    const logId = `log_${Date.now()}_${logCounter++}`;
    await this.persistence.timeLogs.insert(logId, taskId, now);
  }

  async stopTimer(projectId?: string): Promise<void> {
    const now = new Date().toISOString();

    if (projectId) {
      await this.persistence.timeLogs.closeActiveByProject(now, projectId);
    } else {
      await this.persistence.timeLogs.closeAllActive(now);
    }
  }

  async resumeTimer(taskId: string): Promise<void> {
    return this.startTimer(taskId);
  }

  async getActiveLogs(): Promise<string[]> {
    return this.persistence.timeLogs.queryActive();
  }

  // Pure Elapsed Accessors & Computed Metrics
  async getComputedMetrics(nowIso?: string): Promise<EngineComputedMetrics> {
    const state = await this.persistence.core.load();
    if (!state) {
      return {
        snapshotNowIso: nowIso || new Date().toISOString(),
        tasks: {},
        projects: {},
      };
    }
    return computeAllMetrics(state.tasks, state.logs, state.projects, nowIso);
  }

  async getTaskElapsed(taskId: string, nowIso?: string): Promise<number> {
    const state = await this.persistence.core.load();
    if (!state) {
      return 0;
    }
    return calculateTaskElapsed(taskId, state.tasks, state.logs, nowIso);
  }

  async getProjectElapsed(projectId: string, nowIso?: string): Promise<number> {
    const state = await this.persistence.core.load();
    if (!state) {
      return 0;
    }
    return calculateProjectElapsed(projectId, state.tasks, state.logs, nowIso);
  }

  async getElapsedRange(range: ElapsedRangeFilter, nowIso?: string): Promise<number> {
    const state = await this.persistence.core.load();
    if (!state) {
      return 0;
    }
    return calculateElapsedRange(range, state.tasks, state.logs, nowIso);
  }


  // TimeLogs
  async editTimeLog(
    id: string,
    taskId: string,
    startTime: string,
    endTime: string | null,
    note: string | null,
    reason: string | null
  ): Promise<void> {
    const state = await this.persistence.core.load();
    if (!state) {
      const err = new EngineException('Database state not initialized', undefined, 'ERR_ENGINE_STATE');
      ErrorHandler.handle(err);
      throw err;
    }

    const currentLog = state.logs.find(l => l.id === id);
    if (!currentLog) {
      throw new EntityNotFoundException(`Time log ${id} not found`);
    }

    try {
      validateTimeLog(id, startTime, endTime, state.logs);
    } catch (err) {
      ErrorHandler.handle(err);
      throw err;
    }

    const prevStartTime = currentLog.startTime !== startTime ? currentLog.startTime : undefined;
    const prevEndTime = currentLog.endTime !== endTime ? (currentLog.endTime || undefined) : undefined;

    const prevNote = currentLog.note !== note ? (currentLog.note || undefined) : undefined;

    const historyItem = {
      editedAt: new Date().toISOString(),
      prevStartTime,
      prevEndTime,
      prevNote,
      reason: reason || undefined,
    };

    const updatedHistory = currentLog.editHistory ? [...currentLog.editHistory, historyItem] : [historyItem];

    state.logs = state.logs.map(l => {
      if (l.id === id) {
        return {
          ...l,
          taskId,
          startTime,
          endTime: endTime || undefined,
          note: note || undefined,
          editHistory: updatedHistory,
        };
      }
      return l;
    });

    if (state.activeLog && state.activeLog.id === id) {
      state.activeLog = {
        ...state.activeLog,
        taskId,
        startTime,
        endTime: endTime || undefined,
        note: note || undefined,
        editHistory: updatedHistory,
      };
    }

    await this.persistence.core.overrideState(state);
  }

  // Projects
  async addProject(input: CreateProjectInput): Promise<TimerRepositoryState> {
    const state = await this.persistence.core.load();
    if (state) {
      validateProjectName(input.name, state.projects);
    }
    return this.persistence.projects.add({
      name: input.name,
      color: input.color,
      description: input.description ?? null,
      icon: input.icon ?? null,
      tags: input.tags ?? null,
    });
  }

  async updateProject(
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ): Promise<TimerRepositoryState> {
    const state = await this.persistence.core.load();
    if (state) {
      validateProjectName(name, state.projects, projectId);
    }
    return this.persistence.projects.update(projectId, name, color, description, icon, tags);
  }

  async renameProject(projectId: string, name: string): Promise<TimerRepositoryState> {
    const state = await this.persistence.core.load();
    if (state) {
      validateProjectName(name, state.projects, projectId);
    }
    return this.persistence.projects.rename(projectId, name);
  }

  async toggleProjectArchive(projectId: string): Promise<TimerRepositoryState> {
    return this.persistence.projects.toggleArchive(projectId);
  }

  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    const state = await this.persistence.core.load();
    if (!state) {
      return { totalDurationSec: BigInt(0), totalTasks: 0, completedTasks: 0 };
    }

    const projectTasks = state.tasks.filter(t => t.projectId === projectId);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.completed).length;
    const totalDurationSec = BigInt(calculateProjectElapsed(projectId, state.tasks, state.logs));

    return {
      totalDurationSec,
      totalTasks,
      completedTasks,
    };
  }

  // Tasks
  async addTask(input: CreateTaskInput): Promise<TimerRepositoryState> {
    const state = await this.persistence.core.load();
    validateTaskName(input.name);
    if (state) {
      validateTaskHierarchy(null, input.parentTaskId, state.tasks);
    }
    return this.persistence.tasks.add({
      projectId: input.projectId,
      name: input.name,
      parentTaskId: input.parentTaskId ?? null,
    });
  }

  async updateTask(
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ): Promise<TimerRepositoryState> {
    const state = await this.persistence.core.load();
    if (name) {
      validateTaskName(name);
    }
    if (state) {
      validateTaskHierarchy(taskId, parentTaskId, state.tasks);
    }
    return this.persistence.tasks.update(taskId, name, parentTaskId, status, completed);
  }

  async renameTask(taskId: string, name: string): Promise<TimerRepositoryState> {
    validateTaskName(name);
    return this.persistence.tasks.rename(taskId, name);
  }


  async deleteTask(taskId: string): Promise<TimerRepositoryState> {
    return this.persistence.tasks.delete(taskId);
  }

  async toggleTaskComplete(taskId: string): Promise<TimerRepositoryState> {
    return this.persistence.tasks.toggleComplete(taskId);
  }

  // Configuration
  async getSettings(): Promise<Settings> {
    return this.persistence.settings.get();
  }

  async saveSettings(settings: Settings): Promise<void> {
    return this.persistence.settings.save(settings);
  }

  async getRuntimeConfigs(): Promise<RuntimeConfig[]> {
    return this.persistence.runtimeConfigs.getAll();
  }

  async saveRuntimeConfig(config: RuntimeConfig): Promise<void> {
    return this.persistence.runtimeConfigs.save(config);
  }

  // State Management
  async getState(): Promise<TimerRepositoryState | null> {
    return this.persistence.core.load();
  }

  async resetState(): Promise<TimerRepositoryState> {
    return this.persistence.core.reset();
  }
}

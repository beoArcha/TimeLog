import { IEngine } from '@common/engine/IEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EntityNotFoundException, EngineException, ErrorHandler } from '@common/exceptions';
import { ProjectStatistics } from '@bindings/ProjectStatistics';
import {
  calculateProjectElapsed,
  calculateTaskElapsed,
  calculateElapsedRange,
  computeAllMetrics,
  ElapsedRangeFilter,
  EngineComputedMetrics,
} from './elapsed';
import { validateTimeLog } from './validation';

let logCounter = 0;

export class EnginePlugin implements IEngine {
  private persistence = PersistenceRouter.getInstance();

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

  async getProjectStatistics(projectId: string): Promise<ProjectStatistics> {
    const state = await this.persistence.core.load();
    if (!state) {
      return { totalDurationSec: 0, totalTasks: 0, completedTasks: 0 };
    }

    const projectTasks = state.tasks.filter(t => t.projectId === projectId);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.completed).length;
    const totalDurationSec = calculateProjectElapsed(projectId, state.tasks, state.logs);

    return {
      totalDurationSec,
      totalTasks,
      completedTasks,
    };
  }
}

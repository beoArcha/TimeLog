import { IEngine } from '@common/engine/IEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { EntityNotFoundException } from '@common/exceptions';
import { ProjectStatistics } from '@bindings/ProjectStatistics';

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
      throw new Error('Database state not initialized');
    }

    const currentLog = state.logs.find(l => l.id === id);
    if (!currentLog) {
      throw new EntityNotFoundException(`Time log ${id} not found`);
    }

    const start = new Date(startTime).getTime();
    if (isNaN(start)) {
      throw new Error('Parse time error: start_time is invalid');
    }
    const end = endTime ? new Date(endTime).getTime() : Date.now();
    if (isNaN(end)) {
      throw new Error('Parse time error: end_time is invalid');
    }
    if (end < start) {
      throw new Error('End time cannot be before start time');
    }
    if (start > Date.now()) {
      throw new Error('Start time cannot be in the future');
    }

    for (const log of state.logs) {
      if (log.id === id) {
        continue;
      }
      const logStart = new Date(log.startTime).getTime();
      const logEnd = log.endTime ? new Date(log.endTime).getTime() : Date.now();
      if (start < logEnd && logStart < end) {
        throw new Error(`Time log overlaps with an existing log (ID: ${log.id})`);
      }
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
      return { totalDurationSec: BigInt(0), totalTasks: 0, completedTasks: 0 };
    }

    const projectTasks = state.tasks.filter(t => t.projectId === projectId);
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.completed).length;

    const taskIds = new Set(projectTasks.map(t => t.id));
    let totalDurationSec = BigInt(0);

    for (const log of state.logs) {
      if (taskIds.has(log.taskId)) {
        const start = new Date(log.startTime).getTime();
        const end = log.endTime ? new Date(log.endTime).getTime() : Date.now();
        if (end >= start) {
          totalDurationSec += BigInt(Math.floor((end - start) / 1000));
        }
      }
    }

    return {
      totalDurationSec,
      totalTasks,
      completedTasks,
    };
  }
}


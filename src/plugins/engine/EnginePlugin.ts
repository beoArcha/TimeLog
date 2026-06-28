import { IEngine } from '@common/engine/IEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { TimeLog } from '@bindings/TimeLog';

let logCounter = 0;

export class EnginePlugin implements IEngine {
  private persistence = PersistenceRouter.getInstance();

  async startTimer(taskId: string): Promise<void> {
    const state = await this.persistence.load();
    if (!state) {
      throw new Error('State not initialized');
    }

    const task = state.tasks.find(t => t.id === taskId);
    if (!task) {
      throw new Error(`Task with ID ${taskId} not found`);
    }

    const projectId = task.projectId;
    const now = new Date().toISOString();

    const projectTaskIds = new Set(
      state.tasks.filter(t => t.projectId === projectId).map(t => t.id)
    );

    const updatedLogs = state.logs.map(log => {
      if (!log.endTime && projectTaskIds.has(log.taskId)) {
        return { ...log, endTime: now };
      }
      return log;
    });

    const logId = `log_${Date.now()}_${logCounter++}`;
    const newLog: TimeLog = {
      id: logId,
      taskId,
      projectId,
      startTime: now,
    };

    updatedLogs.push(newLog);

    await this.persistence.overrideState({
      logs: updatedLogs,
      activeLog: newLog
    });
  }

  async stopTimer(projectId?: string): Promise<void> {
    const state = await this.persistence.load();
    if (!state) {
      throw new Error('State not initialized');
    }

    const now = new Date().toISOString();
    let updatedLogs: TimeLog[];

    if (projectId) {
      const projectTaskIds = new Set(
        state.tasks.filter(t => t.projectId === projectId).map(t => t.id)
      );
      updatedLogs = state.logs.map(log => {
        if (!log.endTime && projectTaskIds.has(log.taskId)) {
          return { ...log, endTime: now };
        }
        return log;
      });
    } else {
      updatedLogs = state.logs.map(log => {
        if (!log.endTime) {
          return { ...log, endTime: now };
        }
        return log;
      });
    }

    const activeLog = updatedLogs.find(log => !log.endTime) || null;

    await this.persistence.overrideState({
      logs: updatedLogs,
      activeLog
    });
  }
}

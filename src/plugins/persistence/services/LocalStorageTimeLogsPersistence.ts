import { ITimeLogsPersistence } from '@common/persistence/IPersistence';
import { TimeLog } from '@bindings/TimeLog';
import { PersistenceException } from '@common/exceptions';
import { ILocalStorageStateStore } from './LocalStorageStateStore';

export class LocalStorageTimeLogsPersistence implements ITimeLogsPersistence {
  constructor(private readonly store: ILocalStorageStateStore) {}

  async getForTask(taskId: string): Promise<TimeLog[]> {
    const current = await this.store.getStateOrDefault();
    return current.logs.filter((l) => l.taskId === taskId);
  }

  async closeActiveByProject(endTime: string, projectId: string): Promise<void> {
    const current = await this.store.getStateOrDefault();
    const projectTaskIds = new Set(
      current.tasks.filter((t) => t.projectId === projectId).map((t) => t.id)
    );
    let changed = false;
    current.logs = current.logs.map((log) => {
      if (!log.endTime && projectTaskIds.has(log.taskId)) {
        changed = true;
        return { ...log, endTime };
      }
      return log;
    });
    if (changed) {
      current.activeLog = current.logs.find((l) => !l.endTime) || null;
      await this.store.save(current);
    }
  }

  async closeAllActive(endTime: string): Promise<void> {
    const current = await this.store.getStateOrDefault();
    let changed = false;
    current.logs = current.logs.map((log) => {
      if (!log.endTime) {
        changed = true;
        return { ...log, endTime };
      }
      return log;
    });
    if (changed) {
      current.activeLog = null;
      await this.store.save(current);
    }
  }

  async insert(logId: string, taskId: string, startTime: string): Promise<void> {
    const current = await this.store.getStateOrDefault();
    const task = current.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new PersistenceException(
        `Task ${taskId} not found`,
        undefined,
        'ERR_PERSISTENCE_TASK_NOT_FOUND'
      );
    }
    const newLog: TimeLog = {
      id: logId,
      taskId,
      projectId: task.projectId,
      startTime,
      endTime: undefined,
      note: undefined,
      editHistory: undefined,
    };
    current.logs.push(newLog);
    current.activeLog = newLog;
    await this.store.save(current);
  }

  async queryActive(): Promise<string[]> {
    const current = await this.store.getStateOrDefault();
    return current.logs.filter((l) => !l.endTime).map((l) => l.taskId);
  }

  async getAll(): Promise<TimeLog[]> {
    const current = await this.store.getStateOrDefault();
    return current.logs;
  }

  async delete(logId: string): Promise<void> {
    const current = await this.store.getStateOrDefault();
    const initialLen = current.logs.length;
    current.logs = current.logs.filter((l) => l.id !== logId);
    if (current.activeLog?.id === logId) {
      current.activeLog = null;
    }
    if (current.logs.length !== initialLen) {
      await this.store.save(current);
    }
  }
}

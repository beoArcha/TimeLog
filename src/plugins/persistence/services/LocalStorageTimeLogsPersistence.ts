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
    await this.store.mutate((current) => {
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
      }
    });
  }

  async closeAllActive(endTime: string): Promise<void> {
    await this.store.mutate((current) => {
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
      }
    });
  }

  async insert(logId: string, taskId: string, startTime: string): Promise<void> {
    await this.store.mutate((current) => {
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
    });
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
    await this.store.mutate((current) => {
      const exists = current.logs.some((l) => l.id === logId) || current.activeLog?.id === logId;
      if (!exists) {
        throw new PersistenceException(
          `TimeLog ${logId} not found`,
          undefined,
          'ERR_PERSISTENCE_LOG_NOT_FOUND'
        );
      }
      current.logs = current.logs.filter((l) => l.id !== logId);
      if (current.activeLog?.id === logId) {
        current.activeLog = null;
      }
    });
  }

  async startTimerSession(taskId: string, now: string, logId: string): Promise<void> {
    await this.store.mutate((current) => {
      const task = current.tasks.find((t) => t.id === taskId);
      if (!task) {
        throw new PersistenceException(
          `Task ${taskId} not found`,
          undefined,
          'ERR_PERSISTENCE_TASK_NOT_FOUND'
        );
      }

      const projectId = task.projectId;
      const project = current.projects.find((p) => p.id === projectId);
      const allowsConcurrency = project?.allowConcurrency ?? false;

      // 1. Close active logs for current project
      const projectTaskIds = new Set(
        current.tasks.filter((t) => t.projectId === projectId).map((t) => t.id)
      );
      current.logs = current.logs.map((log) => {
        if (!log.endTime && projectTaskIds.has(log.taskId)) {
          return { ...log, endTime: now };
        }
        return log;
      });

      // 2. If non-concurrent, close active logs of other non-concurrent projects
      if (!allowsConcurrency) {
        const taskMap = new Map(current.tasks.map((t) => [t.id, t]));
        const projectMap = new Map(current.projects.map((p) => [p.id, p]));

        current.logs = current.logs.map((log) => {
          if (!log.endTime) {
            const activeTask = taskMap.get(log.taskId);
            const otherProjId = activeTask?.projectId;
            if (otherProjId && otherProjId !== projectId) {
              const otherProj = projectMap.get(otherProjId);
              const isOtherNonConcurrent = !(otherProj?.allowConcurrency ?? false);
              if (isOtherNonConcurrent) {
                return { ...log, endTime: now };
              }
            }
          }
          return log;
        });
      }

      // 3. Insert new log and set activeLog
      const newLog: TimeLog = {
        id: logId,
        taskId,
        projectId,
        startTime: now,
        endTime: undefined,
        note: undefined,
        editHistory: undefined,
      };
      current.logs.push(newLog);
      current.activeLog = newLog;
    });
  }

  async switchTimerSession(taskId: string, now: string, logId: string): Promise<void> {
    await this.store.mutate((current) => {
      const task = current.tasks.find((t) => t.id === taskId);
      if (!task) {
        throw new PersistenceException(
          `Task ${taskId} not found`,
          undefined,
          'ERR_PERSISTENCE_TASK_NOT_FOUND'
        );
      }

      // Close all active logs
      current.logs = current.logs.map((log) => {
        if (!log.endTime) {
          return { ...log, endTime: now };
        }
        return log;
      });

      const newLog: TimeLog = {
        id: logId,
        taskId,
        projectId: task.projectId,
        startTime: now,
        endTime: undefined,
        note: undefined,
        editHistory: undefined,
      };
      current.logs.push(newLog);
      current.activeLog = newLog;
    });
  }
}

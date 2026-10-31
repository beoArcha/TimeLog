import { ITasksPersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { PersistenceException } from '@common/exceptions';
import { validateTaskHierarchy } from '../../engine/validation';
import { ILocalStorageStateStore } from './LocalStorageStateStore';

function resolveStatusAfterCompletionToggle(completed: boolean, currentStatus: TaskStatus): TaskStatus {
  if (completed) {
    return 'Done';
  }
  if (currentStatus === 'Done') {
    return 'Todo';
  }
  return currentStatus;
}

export class LocalStorageTasksPersistence implements ITasksPersistence {
  constructor(private readonly store: ILocalStorageStateStore) {}

  async add(input: {
    projectId: string;
    name: string;
    parentTaskId: string | null;
    hourlyRate?: string | null;
  }): Promise<TimerRepositoryState> {
    return this.store.mutate((current) => {
      try {
        validateTaskHierarchy(null, input.parentTaskId, current.tasks);
      } catch (err) {
        throw new PersistenceException(
          err instanceof Error ? err.message : String(err),
          undefined,
          'ERR_PERSISTENCE_HIERARCHY'
        );
      }
      const now = new Date().toISOString();
      const newTask = {
        id: crypto.randomUUID(),
        projectId: input.projectId,
        name: input.name,
        parentTaskId: input.parentTaskId || undefined,
        createdAt: now,
        completed: false,
        status: 'Todo' as TaskStatus,
        hourlyRate: input.hourlyRate ?? undefined,
      };
      current.tasks.push(newTask);
    });
  }

  async update(
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null,
    hourlyRate?: string | null
  ): Promise<TimerRepositoryState> {
    return this.store.mutate((current) => {
      try {
        validateTaskHierarchy(taskId, parentTaskId, current.tasks);
      } catch (err) {
        throw new PersistenceException(
          err instanceof Error ? err.message : String(err),
          undefined,
          'ERR_PERSISTENCE_HIERARCHY'
        );
      }
      const task = current.tasks.find((t) => t.id === taskId);
      if (!task) {
        throw new PersistenceException(
          `Task ${taskId} not found`,
          undefined,
          'ERR_PERSISTENCE_TASK_NOT_FOUND'
        );
      }

      task.name = name;
      task.parentTaskId = parentTaskId || undefined;

      if (completed !== null) {
        task.completed = completed;
        task.status = resolveStatusAfterCompletionToggle(completed, task.status);
      } else if (status !== null) {
        task.status = status;
        task.completed = status === 'Done';
      }

      if (hourlyRate !== undefined) {
        task.hourlyRate = hourlyRate ?? undefined;
      }
    });
  }

  async rename(taskId: string, name: string): Promise<TimerRepositoryState> {
    return this.store.mutate((current) => {
      const task = current.tasks.find((t) => t.id === taskId);
      if (!task) {
        throw new PersistenceException(
          `Task ${taskId} not found`,
          undefined,
          'ERR_PERSISTENCE_TASK_NOT_FOUND'
        );
      }
      task.name = name;
    });
  }

  async delete(id: string): Promise<TimerRepositoryState> {
    return this.store.mutate((current) => {
      const exists = current.tasks.some((t) => t.id === id);
      if (!exists) {
        throw new PersistenceException(
          `Task ${id} not found`,
          undefined,
          'ERR_PERSISTENCE_TASK_NOT_FOUND'
        );
      }

      const idsToDelete = new Set<string>([id]);
      let added: boolean;
      do {
        added = false;
        current.tasks.forEach((t) => {
          if (t.parentTaskId && idsToDelete.has(t.parentTaskId) && !idsToDelete.has(t.id)) {
            idsToDelete.add(t.id);
            added = true;
          }
        });
      } while (added);

      current.tasks = current.tasks.filter((t) => !idsToDelete.has(t.id));
      current.logs = current.logs.filter((l) => !idsToDelete.has(l.taskId));

      if (current.activeLog && idsToDelete.has(current.activeLog.taskId)) {
        current.activeLog = null;
      }
    });
  }

  async toggleComplete(taskId: string): Promise<TimerRepositoryState> {
    return this.store.mutate((current) => {
      const task = current.tasks.find((t) => t.id === taskId);
      if (!task) {
        throw new PersistenceException(
          `Task ${taskId} not found`,
          undefined,
          'ERR_PERSISTENCE_TASK_NOT_FOUND'
        );
      }
      task.completed = !task.completed;
      task.status = task.completed ? 'Done' : 'Todo';
      if (task.completed && current.activeLog?.taskId === taskId) {
        const now = new Date().toISOString();
        current.activeLog.endTime = now;
        current.logs = current.logs.map((l) =>
          l.id === current.activeLog?.id ? { ...l, endTime: now } : l
        );
        current.activeLog = null;
      }
    });
  }

  async getProjectId(taskId: string): Promise<string> {
    const current = await this.store.getStateOrDefault();
    const task = current.tasks.find((t) => t.id === taskId);
    if (!task) {
      throw new PersistenceException(
        `Task ${taskId} not found`,
        undefined,
        'ERR_PERSISTENCE_TASK_NOT_FOUND'
      );
    }
    return task.projectId;
  }

  async getSubtasks(taskId: string): Promise<Task[]> {
    const current = await this.store.getStateOrDefault();
    return current.tasks.filter((t) => t.parentTaskId === taskId);
  }
}

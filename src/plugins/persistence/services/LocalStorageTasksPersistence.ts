import { ITasksPersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';
import { PersistenceException } from '@common/exceptions';
import { validateTaskHierarchy } from '../../engine/validation';
import { ILocalStorageStateStore } from './LocalStorageStateStore';

export class LocalStorageTasksPersistence implements ITasksPersistence {
  constructor(private readonly store: ILocalStorageStateStore) {}

  async add(input: {
    projectId: string;
    name: string;
    parentTaskId: string | null;
  }): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
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
    };
    current.tasks.push(newTask);
    return this.store.save(current);
  }

  async update(
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
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
    if (task) {
      task.name = name;
      task.parentTaskId = parentTaskId || undefined;

      if (completed !== null) {
        task.completed = completed;
        if (completed) {
          task.status = 'Done';
        } else if (task.status === 'Done') {
          task.status = 'Todo';
        }
      } else if (status !== null) {
        task.status = status;
        task.completed = status === 'Done';
      }
    }
    return this.store.save(current);
  }

  async rename(taskId: string, name: string): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    const task = current.tasks.find((t) => t.id === taskId);
    if (task) {
      task.name = name;
    }
    return this.store.save(current);
  }

  async delete(id: string): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();

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

    return this.store.save(current);
  }

  async toggleComplete(taskId: string): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    const task = current.tasks.find((t) => t.id === taskId);
    if (task) {
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
    }
    return this.store.save(current);
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

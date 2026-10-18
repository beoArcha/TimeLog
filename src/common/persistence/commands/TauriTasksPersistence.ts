import { invoke } from '@tauri-apps/api/core';
import { ITasksPersistence } from '../IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { TasksPersistenceCommand } from '@bindings/TasksPersistenceCommand';
import { Task } from '@bindings/Task';
import { TaskStatus } from '@bindings/TaskStatus';

export class TauriTasksPersistence implements ITasksPersistence {
  constructor() {}

  async add(input: {
    projectId: string;
    name: string;
    parentTaskId: string | null;
  }): Promise<TimerRepositoryState> {
    const cmd: TasksPersistenceCommand = 'create';
    return invoke<TimerRepositoryState>(cmd, {
      projectId: input.projectId,
      name: input.name,
      parentTaskId: input.parentTaskId,
    });
  }

  async update(
    taskId: string,
    name: string,
    parentTaskId: string | null,
    status: TaskStatus | null,
    completed: boolean | null
  ): Promise<TimerRepositoryState> {
    const cmd: TasksPersistenceCommand = 'update_task';
    return invoke<TimerRepositoryState>(cmd, {
      taskId,
      name,
      parentTaskId,
      status,
      completed,
    });
  }

  async rename(taskId: string, name: string): Promise<TimerRepositoryState> {
    const cmd: TasksPersistenceCommand = 'rename_task';
    return invoke<TimerRepositoryState>(cmd, { taskId, name });
  }

  async delete(taskId: string): Promise<TimerRepositoryState> {
    const cmd: TasksPersistenceCommand = 'delete';
    return invoke<TimerRepositoryState>(cmd, { taskId });
  }

  async toggleComplete(taskId: string): Promise<TimerRepositoryState> {
    const cmd: TasksPersistenceCommand = 'toggle_complete';
    return invoke<TimerRepositoryState>(cmd, { taskId });
  }

  async getProjectId(taskId: string): Promise<string> {
    const cmd: TasksPersistenceCommand = 'get_task_project_id';
    return invoke<string>(cmd, { taskId });
  }

  async getSubtasks(taskId: string): Promise<Task[]> {
    const cmd: TasksPersistenceCommand = 'get_subtasks';
    return invoke<Task[]>(cmd, { taskId });
  }
}

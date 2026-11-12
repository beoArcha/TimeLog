import type { Project } from '@bindings/Project';
import type { Task } from '@bindings/Task';
import { ENTITY_PROJECT, ENTITY_TASK, MSG_TASK_HIERARCHY_CYCLE } from './constants';
import { businessViolation, entityNotFound } from './errors';

/** Read-only lookups over one snapshot of projects and tasks. */
export class Catalog {
  private readonly projects: Map<string, Project>;
  private readonly tasks: Map<string, Task>;

  constructor(
    projects: readonly Project[],
    private readonly taskList: readonly Task[]
  ) {
    this.projects = new Map(projects.map((project) => [project.id, project]));
    this.tasks = new Map(taskList.map((task) => [task.id, task]));
  }

  project(id: string): Project {
    const project = this.projects.get(id);
    if (!project) throw entityNotFound(ENTITY_PROJECT, id);
    return project;
  }

  task(id: string): Task {
    const task = this.tasks.get(id);
    if (!task) throw entityNotFound(ENTITY_TASK, id);
    return task;
  }

  allTasks(): readonly Task[] {
    return this.taskList;
  }

  /**
   * The task itself first, its root last. The walk is bounded by the task count so corrupt parent
   * links surface as an error instead of looping forever.
   */
  chain(taskId: string): Task[] {
    const chain = [this.task(taskId)];
    let parentId = chain[0].parentTaskId;
    while (parentId !== undefined && parentId !== null) {
      if (chain.length > this.tasks.size) throw businessViolation(`${MSG_TASK_HIERARCHY_CYCLE} '${taskId}'`);
      const parent = this.task(parentId);
      chain.push(parent);
      parentId = parent.parentTaskId;
    }
    return chain;
  }
}

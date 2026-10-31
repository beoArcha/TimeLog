import { IProjectsPersistence } from '@common/persistence/IPersistence';
import { Project } from '@bindings/Project';
import { TimeLog } from '@bindings/TimeLog';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { PersistenceException } from '@common/exceptions';
import { ILocalStorageStateStore } from './LocalStorageStateStore';

export class ValidationException extends PersistenceException {
  constructor(message: string, code = 'ERR_PERSISTENCE_VALIDATION', cause?: unknown) {
    super(message, cause, code);
  }
}

export class LocalStorageProjectsPersistence implements IProjectsPersistence {
  constructor(private readonly store: ILocalStorageStateStore) {}

  private findProjectOrThrow(projects: readonly Project[], id: string): Project {
    const project = projects.find((p) => p.id === id);
    if (!project) {
      throw new PersistenceException(
        `Project with ID '${id}' not found`,
        undefined,
        'ERR_PERSISTENCE_PROJECT_NOT_FOUND'
      );
    }
    return project;
  }

  private async mutateProject(
    projectId: string,
    mutator: (project: Project) => void
  ): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    const project = this.findProjectOrThrow(current.projects, projectId);
    mutator(project);
    return this.store.save(current);
  }

  async add(input: {
    name: string;
    color: string;
    description?: string | null;
    icon?: string | null;
    tags?: string[] | null;
    allowConcurrency?: boolean | null;
  }): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name: input.name,
      color: input.color,
      createdAt: new Date().toISOString(),
      archived: false,
      description: input.description ?? undefined,
      icon: input.icon ?? undefined,
      tags: input.tags ?? undefined,
      allowConcurrency: input.allowConcurrency ?? undefined,
    };
    current.projects.push(newProject);
    return this.store.save(current);
  }

  async toggleArchive(projectId: string): Promise<TimerRepositoryState> {
    return this.mutateProject(projectId, (project) => {
      project.archived = !project.archived;
    });
  }

  async update(
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null,
    allowConcurrency?: boolean | null
  ): Promise<TimerRepositoryState> {
    return this.mutateProject(projectId, (project) => {
      project.name = name;
      project.color = color;
      project.description = description ?? undefined;
      project.icon = icon ?? undefined;
      project.tags = tags ?? undefined;
      project.allowConcurrency = allowConcurrency ?? undefined;
    });
  }

  async rename(projectId: string, name: string): Promise<TimerRepositoryState> {
    return this.mutateProject(projectId, (project) => {
      project.name = name;
    });
  }

  async delete(projectId: string): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    this.findProjectOrThrow(current.projects, projectId);

    const projectTaskIds = new Set<string>();
    current.tasks.forEach((t) => {
      if (t.projectId === projectId) {
        projectTaskIds.add(t.id);
      }
    });

    let added: boolean;
    do {
      added = false;
      current.tasks.forEach((t) => {
        if (t.parentTaskId && projectTaskIds.has(t.parentTaskId) && !projectTaskIds.has(t.id)) {
          projectTaskIds.add(t.id);
          added = true;
        }
      });
    } while (added);

    const stateAny = current as { logs?: TimeLog[]; timeLogs?: TimeLog[] };
    const logs = stateAny.logs ?? stateAny.timeLogs ?? [];

    const hasActiveTimer =
      Boolean(
        current.activeLog &&
          (current.activeLog.projectId === projectId || projectTaskIds.has(current.activeLog.taskId))
      ) ||
      Boolean(
        current.activeLogs?.some(
          (l) => l.projectId === projectId || projectTaskIds.has(l.taskId)
        )
      ) ||
      logs.some(
        (l) =>
          (l.projectId === projectId || projectTaskIds.has(l.taskId)) &&
          (!l.endTime || l.endTime === null)
      );

    if (hasActiveTimer) {
      throw new ValidationException(
        'Cannot delete project with active timer. Stop timer first',
        'ERR_PERSISTENCE_ACTIVE_TIMER'
      );
    }

    const projectLogs = logs.filter(
      (l) => l.projectId === projectId || projectTaskIds.has(l.taskId)
    );

    let totalDuration = 0;
    for (const log of projectLogs) {
      const start = new Date(log.startTime).getTime();
      const end = log.endTime ? new Date(log.endTime).getTime() : Date.now();
      if (end >= start) {
        totalDuration += Math.max(0, Math.floor((end - start) / 1000));
      }
    }

    if (projectLogs.length > 0 || totalDuration > 0) {
      throw new ValidationException(
        'Cannot delete project with logged time',
        'ERR_PERSISTENCE_VALIDATION'
      );
    }

    current.projects = current.projects.filter((p) => p.id !== projectId);
    current.tasks = current.tasks.filter((t) => !projectTaskIds.has(t.id));
    if (current.logs) {
      current.logs = current.logs.filter(
        (l) => l.projectId !== projectId && !projectTaskIds.has(l.taskId)
      );
    }
    if ((current as { timeLogs?: TimeLog[] }).timeLogs) {
      (current as { timeLogs?: TimeLog[] }).timeLogs = (
        current as { timeLogs?: TimeLog[] }
      ).timeLogs!.filter(
        (l) => l.projectId !== projectId && !projectTaskIds.has(l.taskId)
      );
    }

    return this.store.save(current);
  }
}

import { IProjectsPersistence } from '@common/persistence/IPersistence';
import { Project } from '@bindings/Project';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { PersistenceException } from '@common/exceptions';
import { ILocalStorageStateStore } from './LocalStorageStateStore';

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
}

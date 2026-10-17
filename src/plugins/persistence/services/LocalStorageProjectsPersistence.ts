import { IProjectsPersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { ILocalStorageStateStore } from './LocalStorageStateStore';

export class LocalStorageProjectsPersistence implements IProjectsPersistence {
  constructor(private readonly store: ILocalStorageStateStore) {}

  async add(input: {
    name: string;
    color: string;
    description?: string | null;
    icon?: string | null;
    tags?: string[] | null;
  }): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    const now = new Date().toISOString();
    const newProject = {
      id: crypto.randomUUID(),
      name: input.name,
      color: input.color,
      createdAt: now,
      archived: false,
      description: input.description || undefined,
      icon: input.icon || undefined,
      tags: input.tags || undefined,
    };
    current.projects.push(newProject);
    return this.store.save(current);
  }

  async toggleArchive(projectId: string): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    const project = current.projects.find((p) => p.id === projectId);
    if (project) {
      project.archived = !project.archived;
      if (project.archived && current.activeLog && current.activeLog.projectId === projectId) {
        const now = new Date().toISOString();
        current.logs = current.logs.map((log) =>
          log.id === current.activeLog?.id ? { ...log, endTime: now } : log
        );
        current.activeLog = null;
      }
    }
    return this.store.save(current);
  }

  async update(
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    const project = current.projects.find((p) => p.id === projectId);
    if (project) {
      project.name = name;
      project.color = color;
      project.description = description || undefined;
      project.icon = icon || undefined;
      project.tags = tags || undefined;
    }
    return this.store.save(current);
  }

  async rename(projectId: string, name: string): Promise<TimerRepositoryState> {
    const current = await this.store.getStateOrDefault();
    const project = current.projects.find((p) => p.id === projectId);
    if (project) {
      project.name = name;
    }
    return this.store.save(current);
  }
}

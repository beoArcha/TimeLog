import { invoke } from '@tauri-apps/api/core';
import { IProjectsPersistence } from '../IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { ProjectsPersistenceCommand } from '@bindings/ProjectsPersistenceCommand';

export class TauriProjectsPersistence implements IProjectsPersistence {
  constructor() {}

  async add(input: {
    name: string;
    color: string;
    description?: string | null;
    icon?: string | null;
    tags?: string[] | null;
  }): Promise<TimerRepositoryState> {
    const cmd: ProjectsPersistenceCommand = 'add';
    return invoke<TimerRepositoryState>(cmd, {
      name: input.name,
      color: input.color,
      description: input.description ?? null,
      icon: input.icon ?? null,
      tags: input.tags ?? null,
    });
  }

  async toggleArchive(projectId: string): Promise<TimerRepositoryState> {
    const cmd: ProjectsPersistenceCommand = 'toggle_archive';
    return invoke<TimerRepositoryState>(cmd, { projectId });
  }

  async update(
    projectId: string,
    name: string,
    color: string,
    description: string | null,
    icon: string | null,
    tags: string[] | null
  ): Promise<TimerRepositoryState> {
    const cmd: ProjectsPersistenceCommand = 'update_project';
    return invoke<TimerRepositoryState>(cmd, {
      projectId,
      name,
      color,
      description,
      icon,
      tags,
    });
  }

  async rename(projectId: string, name: string): Promise<TimerRepositoryState> {
    const cmd: ProjectsPersistenceCommand = 'rename_project';
    return invoke<TimerRepositoryState>(cmd, { projectId, name });
  }
}

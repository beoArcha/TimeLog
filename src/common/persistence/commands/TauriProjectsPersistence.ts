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
    allowConcurrency?: boolean | null;
    hourlyRate?: string | null;
    currency?: string | null;
  }): Promise<TimerRepositoryState> {
    const cmd: ProjectsPersistenceCommand = 'add';
    return invoke<TimerRepositoryState>(cmd, {
      name: input.name,
      color: input.color,
      description: input.description ?? null,
      icon: input.icon ?? null,
      tags: input.tags ?? null,
      allowConcurrency: input.allowConcurrency ?? null,
      hourlyRate: input.hourlyRate ?? null,
      currency: input.currency ?? null,
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
    tags: string[] | null,
    allowConcurrency?: boolean | null,
    hourlyRate?: string | null,
    currency?: string | null
  ): Promise<TimerRepositoryState> {
    const cmd: ProjectsPersistenceCommand = 'update_project';
    const input: Record<string, unknown> = {
      projectId,
      name,
      color,
      description,
      icon,
      tags,
      allowConcurrency: allowConcurrency ?? null,
    };
    if (hourlyRate !== undefined) {
      input.hourlyRate = hourlyRate;
    }
    if (currency !== undefined) {
      input.currency = currency;
    }
    return invoke<TimerRepositoryState>(cmd, { input });
  }

  async rename(projectId: string, name: string): Promise<TimerRepositoryState> {
    const cmd: ProjectsPersistenceCommand = 'rename_project';
    return invoke<TimerRepositoryState>(cmd, { projectId, name });
  }

  async delete(projectId: string): Promise<TimerRepositoryState> {
    const cmd: ProjectsPersistenceCommand = 'delete_project';
    return invoke<TimerRepositoryState>(cmd, { projectId });
  }
}

import { IProjectsPersistence } from '@common/persistence/IPersistence';
import { Project } from '@bindings/Project';
import { TimeLog } from '@bindings/TimeLog';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { PersistenceException } from '@common/exceptions';
import { ILocalStorageStateStore } from './LocalStorageStateStore';
import { parseRateToCents } from '@common/engine/billing/utils';

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
    return this.store.mutate((current) => {
      const project = this.findProjectOrThrow(current.projects, projectId);
      mutator(project);
    });
  }

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
    return this.store.mutate((current) => {
      let cents: bigint | undefined;
      if (input.hourlyRate && input.hourlyRate.trim().length > 0) {
        const parsed = parseRateToCents(input.hourlyRate);
        if (parsed !== null) cents = BigInt(parsed);
      }
      const curr = input.currency ? input.currency.trim().toUpperCase() : undefined;
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
        hourlyRate: input.hourlyRate ?? undefined,
        currency: curr,
        billingRateCents: cents,
        billingCurrency: curr,
      };
      current.projects.push(newProject);
    });
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
    allowConcurrency?: boolean | null,
    hourlyRate?: string | null,
    currency?: string | null
  ): Promise<TimerRepositoryState> {
    return this.mutateProject(projectId, (project) => {
      project.name = name;
      project.color = color;
      project.description = description ?? undefined;
      project.icon = icon ?? undefined;
      project.tags = tags ?? undefined;
      project.allowConcurrency = allowConcurrency ?? undefined;
      if (hourlyRate !== undefined) {
        project.hourlyRate = hourlyRate ?? undefined;
        if (hourlyRate && hourlyRate.trim().length > 0) {
          const cents = parseRateToCents(hourlyRate);
          project.billingRateCents = cents !== null ? BigInt(cents) : undefined;
        } else {
          project.billingRateCents = undefined;
        }
      }
      if (currency !== undefined) {
        project.currency = currency ? currency.trim().toUpperCase() : undefined;
        project.billingCurrency = project.currency;
      }
    });
  }

  async rename(projectId: string, name: string): Promise<TimerRepositoryState> {
    return this.mutateProject(projectId, (project) => {
      project.name = name;
    });
  }

  async delete(projectId: string): Promise<TimerRepositoryState> {
    return this.store.mutate((current) => {
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
      current.logs = current.logs.filter(
        (l) => l.projectId !== projectId && !projectTaskIds.has(l.taskId)
      );

      if (
        current.activeLog &&
        (current.activeLog.projectId === projectId ||
          projectTaskIds.has(current.activeLog.taskId))
      ) {
        current.activeLog = null;
      }
    });
  }
}

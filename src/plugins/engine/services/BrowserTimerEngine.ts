import { ITimerEngine } from '@common/engine/IEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { Project } from '@bindings/Project';
import { EngineException } from '@common/exceptions';
import { ENGINE_ERROR_CODES } from '@common/engine/errorCodes';

let logCounter = 0;

export class BrowserTimerEngine implements ITimerEngine {
  private persistence: PersistenceRouter;

  constructor(persistence?: PersistenceRouter) {
    this.persistence = persistence ?? PersistenceRouter.getInstance();
  }

  async startTimer(taskId: string): Promise<void> {
    const state = await this.persistence.core?.load?.();
    const task = state?.tasks?.find((t) => t.id === taskId);
    if (task?.completed) {
      throw new EngineException(
        `Cannot start timer on completed task '${taskId}'`,
        undefined,
        ENGINE_ERROR_CODES.TASK_ALREADY_COMPLETED
      );
    }

    const activeTaskIds = await this.persistence.timeLogs.queryActive();
    if (activeTaskIds.includes(taskId)) {
      return;
    }

    const now = new Date().toISOString();
    const logId = `log_${Date.now()}_${logCounter++}`;

    if (this.persistence.timeLogs.startTimerSession) {
      await this.persistence.timeLogs.startTimerSession(taskId, now, logId);
      return;
    }

    const projectId = await this.persistence.tasks.getProjectId(taskId);

    await this.persistence.timeLogs.closeActiveByProject(now, projectId);

    const reloadedState = state ?? (await this.persistence.core?.load?.());
    const projects = reloadedState?.projects ?? [];
    const currentProj = projects.find((p) => p.id === projectId);
    const allowsConcurrency = currentProj?.allowConcurrency ?? false;

    if (!allowsConcurrency) {
      await this.closeOtherNonConcurrentProjects(projectId, projects, now);
    }

    await this.persistence.timeLogs.insert(logId, taskId, now);
  }

  private async closeOtherNonConcurrentProjects(
    currentProjectId: string,
    projects: readonly Project[],
    now: string
  ): Promise<void> {
    const activeTasks = await this.persistence.timeLogs.queryActive();
    for (const activeTaskId of activeTasks) {
      const otherProjId = await this.persistence.tasks.getProjectId(activeTaskId);
      const isOther = Boolean(otherProjId && otherProjId !== currentProjectId);
      const otherProj = projects.find((p) => p.id === otherProjId);
      const isNonConcurrent = !(otherProj?.allowConcurrency ?? false);

      if (isOther && isNonConcurrent) {
        await this.persistence.timeLogs.closeActiveByProject(now, otherProjId);
      }
    }
  }

  async stopTimer(projectId?: string): Promise<void> {
    const now = new Date().toISOString();

    if (projectId) {
      await this.persistence.timeLogs.closeActiveByProject(now, projectId);
    } else {
      await this.persistence.timeLogs.closeAllActive(now);
    }
  }

  async resumeTimer(taskId: string): Promise<void> {
    return this.startTimer(taskId);
  }

  async switchTimer(taskId: string): Promise<void> {
    const state = await this.persistence.core?.load?.();
    const task = state?.tasks?.find((t) => t.id === taskId);
    if (task?.completed) {
      throw new EngineException(
        `Cannot start timer on completed task '${taskId}'`,
        undefined,
        ENGINE_ERROR_CODES.TASK_ALREADY_COMPLETED
      );
    }

    const now = new Date().toISOString();
    const logId = `log_${Date.now()}_${logCounter++}`;

    if (this.persistence.timeLogs.switchTimerSession) {
      await this.persistence.timeLogs.switchTimerSession(taskId, now, logId);
      return;
    }

    await this.persistence.tasks.getProjectId(taskId);
    await this.persistence.timeLogs.closeAllActive(now);
    await this.persistence.timeLogs.insert(logId, taskId, now);
  }

  async getActiveLogs(): Promise<string[]> {
    return this.persistence.timeLogs.queryActive();
  }
}

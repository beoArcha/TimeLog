import { ITimerEngine } from '@common/engine/IEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';
import { Project } from '@bindings/Project';

let logCounter = 0;

export class BrowserTimerEngine implements ITimerEngine {
  private persistence: PersistenceRouter;

  constructor(persistence?: PersistenceRouter) {
    this.persistence = persistence ?? PersistenceRouter.getInstance();
  }

  async startTimer(taskId: string): Promise<void> {
    const projectId = await this.persistence.tasks.getProjectId(taskId);
    const now = new Date().toISOString();

    await this.persistence.timeLogs.closeActiveByProject(now, projectId);

    const state = await this.persistence.core?.load?.();
    const projects = state?.projects ?? [];
    const currentProj = projects.find((p) => p.id === projectId);
    const allowsConcurrency = currentProj?.allowConcurrency ?? false;

    if (!allowsConcurrency) {
      await this.closeOtherNonConcurrentProjects(projectId, projects, now);
    }

    const logId = `log_${Date.now()}_${logCounter++}`;
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
    await this.persistence.tasks.getProjectId(taskId);
    const now = new Date().toISOString();
    await this.persistence.timeLogs.closeAllActive(now);
    const logId = `log_${Date.now()}_${logCounter++}`;
    await this.persistence.timeLogs.insert(logId, taskId, now);
  }

  async getActiveLogs(): Promise<string[]> {
    return this.persistence.timeLogs.queryActive();
  }
}

import { ITimerEngine } from '@common/engine/IEngine';
import { PersistenceRouter } from '@common/persistence/PersistenceRouter';

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

    const logId = `log_${Date.now()}_${logCounter++}`;
    await this.persistence.timeLogs.insert(logId, taskId, now);
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

  async getActiveLogs(): Promise<string[]> {
    return this.persistence.timeLogs.queryActive();
  }
}

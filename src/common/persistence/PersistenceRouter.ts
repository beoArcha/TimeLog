import { isDesktopEnvironment } from '../utils/environment';
import { IPersistence } from './IPersistence';
import { PersistenceCommands } from './PersistenceCommands';
import { PersistencePlugin } from '../../plugins/persistence/PersistencePlugin';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { Settings } from '@bindings/Settings';

export class PersistenceRouter implements IPersistence {
  private static instance: PersistenceRouter | null = null;
  private implementation: IPersistence;

  private constructor() {
    if (isDesktopEnvironment()) {
      this.implementation = new PersistenceCommands();
    } else {
      this.implementation = new PersistencePlugin();
    }
  }

  static getInstance(): PersistenceRouter {
    if (!PersistenceRouter.instance) {
      PersistenceRouter.instance = new PersistenceRouter();
    }
    return PersistenceRouter.instance;
  }

  setImplementationForTesting(implementation: IPersistence): void {
    this.implementation = implementation;
  }

  async load(): Promise<TimerRepositoryState | null> {
    return this.implementation.load();
  }

  async overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    return this.implementation.overrideState(state);
  }

  async addProject(input: { name: string; color: string }): Promise<TimerRepositoryState> {
    return this.implementation.addProject(input);
  }

  async toggleProjectArchive(projectId: string): Promise<TimerRepositoryState> {
    return this.implementation.toggleProjectArchive(projectId);
  }

  async addTask(input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState> {
    return this.implementation.addTask(input);
  }

  async renameProject(projectId: string, name: string): Promise<TimerRepositoryState> {
    return this.implementation.renameProject(projectId, name);
  }

  async renameTask(taskId: string, name: string): Promise<TimerRepositoryState> {
    return this.implementation.renameTask(taskId, name);
  }

  async deleteTask(taskId: string): Promise<TimerRepositoryState> {
    return this.implementation.deleteTask(taskId);
  }

  async toggleTaskComplete(taskId: string): Promise<TimerRepositoryState> {
    return this.implementation.toggleTaskComplete(taskId);
  }

  async getSettings(): Promise<Settings> {
    return this.implementation.getSettings();
  }

  async saveSettings(settings: Settings): Promise<void> {
    return this.implementation.saveSettings(settings);
  }

  async reset(): Promise<TimerRepositoryState> {
    return this.implementation.reset();
  }
}

import { TimerRepository, TimerRepositoryState, ApiPayload } from './RepositoryTypes';
import { RepositoryFactory } from './RepositoryFactory';
import { REPOSITORY_BACKEND } from './RepositoryConfig';

export class RepositoryManager implements TimerRepository {
  private static instance: RepositoryManager | null = null;
  private activeRepository: TimerRepository;

  private constructor() {
    this.activeRepository = RepositoryFactory.create(REPOSITORY_BACKEND);
  }

  static getInstance(): RepositoryManager {
    if (!RepositoryManager.instance) {
      RepositoryManager.instance = new RepositoryManager();
    }
    return RepositoryManager.instance;
  }

  setBackend(repository: TimerRepository): void {
    this.activeRepository = repository;
  }

  restoreDefaultBackend(): void {
    this.activeRepository = RepositoryFactory.create(REPOSITORY_BACKEND);
  }

  async load(): Promise<TimerRepositoryState | null> {
    return this.activeRepository.load();
  }

  async overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    return this.activeRepository.overrideState(state);
  }

  async addProject(input: { name: string; color: string }): Promise<TimerRepositoryState> {
    return this.activeRepository.addProject(input);
  }

  async toggleProjectArchive(projectId: string): Promise<TimerRepositoryState> {
    return this.activeRepository.toggleProjectArchive(projectId);
  }

  async addTask(input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState> {
    return this.activeRepository.addTask(input);
  }

  async renameProject(projectId: string, name: string): Promise<TimerRepositoryState> {
    return this.activeRepository.renameProject(projectId, name);
  }

  async renameTask(taskId: string, name: string): Promise<TimerRepositoryState> {
    return this.activeRepository.renameTask(taskId, name);
  }

  async deleteTask(taskId: string): Promise<TimerRepositoryState> {
    return this.activeRepository.deleteTask(taskId);
  }

  async toggleTaskComplete(taskId: string): Promise<TimerRepositoryState> {
    return this.activeRepository.toggleTaskComplete(taskId);
  }

  async startTimer(taskId: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }> {
    return this.activeRepository.startTimer(taskId);
  }

  async stopTimer(projectId?: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }> {
    return this.activeRepository.stopTimer(projectId);
  }

  async reset(): Promise<TimerRepositoryState> {
    return this.activeRepository.reset();
  }
}

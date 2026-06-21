import { TimerRepository, TimerRepositoryState, ApiPayload } from '../RepositoryTypes';

export class RemoteTimerRepository implements TimerRepository {
  async load(): Promise<TimerRepositoryState | null> {
    throw new Error('Remote backend not available');
  }

  async overrideState(_state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    throw new Error('Remote backend not available');
  }

  async addProject(_input: { name: string; color: string }): Promise<TimerRepositoryState> {
    throw new Error('Remote backend not available');
  }

  async toggleProjectArchive(_projectId: string): Promise<TimerRepositoryState> {
    throw new Error('Remote backend not available');
  }

  async addTask(_input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState> {
    throw new Error('Remote backend not available');
  }

  async renameProject(_projectId: string, _name: string): Promise<TimerRepositoryState> {
    throw new Error('Remote backend not available');
  }

  async renameTask(_taskId: string, _name: string): Promise<TimerRepositoryState> {
    throw new Error('Remote backend not available');
  }

  async deleteTask(_taskId: string): Promise<TimerRepositoryState> {
    throw new Error('Remote backend not available');
  }

  async toggleTaskComplete(_taskId: string): Promise<TimerRepositoryState> {
    throw new Error('Remote backend not available');
  }

  async startTimer(_taskId: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }> {
    throw new Error('Remote backend not available');
  }

  async stopTimer(_projectId?: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }> {
    throw new Error('Remote backend not available');
  }

  async reset(): Promise<TimerRepositoryState> {
    throw new Error('Remote backend not available');
  }
}

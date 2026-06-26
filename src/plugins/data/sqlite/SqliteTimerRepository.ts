import { TimerRepository, TimerRepositoryState, ApiPayload } from '../RepositoryTypes';
import { invoke } from '@tauri-apps/api/core';

export class SqliteTimerRepository implements TimerRepository {
  async load(): Promise<TimerRepositoryState | null> {
    try {
      const state = await invoke<TimerRepositoryState>('get_timer_state');
      if (state.projects.length === 0 && state.tasks.length === 0) {
        return null;
      }
      return state;
    } catch (err) {
      console.error('Failed to load state from SQLite:', err);
      throw err;
    }
  }

  async overrideState(_state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    return this.load() as Promise<TimerRepositoryState>;
  }

  async addProject(input: { name: string; color: string }): Promise<TimerRepositoryState> {
    return invoke<TimerRepositoryState>('add_project', { name: input.name, color: input.color });
  }

  async toggleProjectArchive(projectId: string): Promise<TimerRepositoryState> {
    return invoke<TimerRepositoryState>('toggle_project_archive', { projectId });
  }

  async addTask(input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState> {
    return invoke<TimerRepositoryState>('add_task', {
      projectId: input.projectId,
      name: input.name,
      parentTaskId: input.parentTaskId,
    });
  }

  async renameProject(projectId: string, name: string): Promise<TimerRepositoryState> {
    return invoke<TimerRepositoryState>('rename_project', { projectId, name });
  }

  async renameTask(taskId: string, name: string): Promise<TimerRepositoryState> {
    return invoke<TimerRepositoryState>('rename_task', { taskId, name });
  }

  async deleteTask(taskId: string): Promise<TimerRepositoryState> {
    return invoke<TimerRepositoryState>('delete_task', { taskId });
  }

  async toggleTaskComplete(taskId: string): Promise<TimerRepositoryState> {
    return invoke<TimerRepositoryState>('toggle_task_complete', { taskId });
  }

  async startTimer(taskId: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }> {
    await invoke('start_timer', { taskId });
    const state = await this.load();
    const activeLog = state?.activeLog;
    const events: ApiPayload[] = [];
    if (activeLog) {
      events.push({ event: 'START', log: activeLog });
    }
    return { state: state || { projects: [], tasks: [], logs: [], activeLog: null }, events };
  }

  async stopTimer(projectId?: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }> {
    const prevState = await this.load();
    const stoppedLogs = prevState?.logs.filter(l => l.endTime === null || l.endTime === undefined) || [];
    
    await invoke('stop_timer', { projectId });
    const state = await this.load();
    
    const events: ApiPayload[] = [];
    stoppedLogs.forEach(l => {
      events.push({ event: 'TERMINATE', log: { ...l, endTime: new Date().toISOString() } });
    });
    return { state: state || { projects: [], tasks: [], logs: [], activeLog: null }, events };
  }

  async reset(): Promise<TimerRepositoryState> {
    return invoke<TimerRepositoryState>('reset_database');
  }
}

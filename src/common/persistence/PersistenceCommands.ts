import { invoke } from '@tauri-apps/api/core';
import { IPersistence } from './IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';
import { ApiPayload } from './IPersistence';

export class PersistenceCommands implements IPersistence {
  async load(): Promise<TimerRepositoryState | null> {
    try {
      const state = await invoke<TimerRepositoryState>('get_timer_state');
      if (state.projects.length === 0 && state.tasks.length === 0) {
        return null;
      }
      return state;
    } catch (err) {
      console.error('Failed to load state from SQLite via Tauri:', err);
      throw err;
    }
  }

  async overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    try {
      await invoke('override_state', { state });
    } catch (err) {
      console.warn('override_state command not supported by backend:', err);
    }
    const currentState = await this.load();
    return currentState || { projects: [], tasks: [], logs: [], activeLog: null };
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

  // TODO(Stage EngineRouter):
  // Temporary compatibility proxy.
  // TODO(Stage EngineRouter):
  // Temporary compatibility proxy.
  async startTimer(taskId: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }> {
    const prevState = await this.load();
    const prevActiveLogs = prevState?.logs.filter(l => l.endTime === null || l.endTime === undefined) || [];
    
    await invoke('start_timer', { taskId });
    const state = await this.load();
    const nextActiveLogs = state?.logs.filter(l => l.endTime === null || l.endTime === undefined) || [];
    
    const events: ApiPayload[] = [];
    
    prevActiveLogs.forEach(prev => {
      const isStillActive = nextActiveLogs.some(n => n.id === prev.id);
      if (!isStillActive) {
        const stoppedLog = state?.logs.find(l => l.id === prev.id);
        if (stoppedLog) {
          events.push({ event: 'TERMINATE', log: stoppedLog });
        }
      }
    });
    
    nextActiveLogs.forEach(next => {
      const wasActive = prevActiveLogs.some(p => p.id === next.id);
      if (!wasActive) {
        events.push({ event: 'START', log: next });
      }
    });
    
    return { state: state || { projects: [], tasks: [], logs: [], activeLog: null }, events };
  }

  // TODO(Stage EngineRouter):
  // Temporary compatibility proxy.
  async stopTimer(projectId?: string): Promise<{ state: TimerRepositoryState; events: ApiPayload[] }> {
    const prevState = await this.load();
    const prevActiveLogs = prevState?.logs.filter(l => l.endTime === null || l.endTime === undefined) || [];
    
    await invoke('stop_timer', { projectId });
    const state = await this.load();
    const nextActiveLogs = state?.logs.filter(l => l.endTime === null || l.endTime === undefined) || [];
    
    const events: ApiPayload[] = [];
    
    prevActiveLogs.forEach(prev => {
      const isStillActive = nextActiveLogs.some(n => n.id === prev.id);
      if (!isStillActive) {
        const stoppedLog = state?.logs.find(l => l.id === prev.id);
        if (stoppedLog) {
          events.push({ event: 'TERMINATE', log: stoppedLog });
        }
      }
    });
    return { state: state || { projects: [], tasks: [], logs: [], activeLog: null }, events };
  }

  async reset(): Promise<TimerRepositoryState> {
    return invoke<TimerRepositoryState>('reset_database');
  }
}

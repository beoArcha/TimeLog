import { IPersistence } from '@common/persistence/IPersistence';
import { TimerRepositoryState } from '@bindings/TimerRepositoryState';

const STORAGE_KEY = 'timelog_persistence_plugin_state';

const getDefaultState = (): TimerRepositoryState => ({
  projects: [],
  tasks: [],
  logs: [],
  activeLog: null,
});

export class PersistencePlugin implements IPersistence {
  async load(): Promise<TimerRepositoryState | null> {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return getDefaultState();
    try {
      return JSON.parse(data) as TimerRepositoryState;
    } catch (e) {
      console.error('Failed to parse persistence state from LocalStorage', e);
      return getDefaultState();
    }
  }

  private async save(state: TimerRepositoryState): Promise<TimerRepositoryState> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return state;
    } catch (e) {
      console.error('Failed to save persistence state to LocalStorage', e);
      throw e;
    }
  }

  async overrideState(state: Partial<TimerRepositoryState>): Promise<TimerRepositoryState> {
    const current = (await this.load()) || getDefaultState();
    const newState = { ...current, ...state };
    return this.save(newState);
  }

  async addProject(input: { name: string; color: string }): Promise<TimerRepositoryState> {
    const current = (await this.load()) || getDefaultState();
    const now = new Date().toISOString();
    const newProject = {
      id: crypto.randomUUID(),
      name: input.name,
      color: input.color,
      createdAt: now,
      archived: false,
    };
    current.projects.push(newProject);
    return this.save(current);
  }

  async toggleProjectArchive(projectId: string): Promise<TimerRepositoryState> {
    const current = (await this.load()) || getDefaultState();
    const project = current.projects.find(p => p.id === projectId);
    if (project) {
      project.archived = !project.archived;
    }
    return this.save(current);
  }

  async addTask(input: { projectId: string; name: string; parentTaskId: string | null }): Promise<TimerRepositoryState> {
    const current = (await this.load()) || getDefaultState();
    const now = new Date().toISOString();
    const newTask = {
      id: crypto.randomUUID(),
      projectId: input.projectId,
      name: input.name,
      parentTaskId: input.parentTaskId,
      createdAt: now,
      completed: false,
    };
    current.tasks.push(newTask);
    return this.save(current);
  }

  async renameProject(projectId: string, name: string): Promise<TimerRepositoryState> {
    const current = (await this.load()) || getDefaultState();
    const project = current.projects.find(p => p.id === projectId);
    if (project) {
      project.name = name;
    }
    return this.save(current);
  }

  async renameTask(taskId: string, name: string): Promise<TimerRepositoryState> {
    const current = (await this.load()) || getDefaultState();
    const task = current.tasks.find(t => t.id === taskId);
    if (task) {
      task.name = name;
    }
    return this.save(current);
  }

  async deleteTask(taskId: string): Promise<TimerRepositoryState> {
    const current = (await this.load()) || getDefaultState();
    current.tasks = current.tasks.filter(t => t.id !== taskId);
    return this.save(current);
  }

  async toggleTaskComplete(taskId: string): Promise<TimerRepositoryState> {
    const current = (await this.load()) || getDefaultState();
    const task = current.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
    }
    return this.save(current);
  }

  async reset(): Promise<TimerRepositoryState> {
    localStorage.removeItem(STORAGE_KEY);
    return getDefaultState();
  }
}

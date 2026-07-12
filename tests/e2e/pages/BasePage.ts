import { Page } from '@playwright/test';
import { Project } from '../../../src/bindings/Project';
import { Task } from '../../../src/bindings/Task';
import { TimeLog } from '../../../src/bindings/TimeLog';

export interface TimerRepositoryState {
  projects: Project[];
  tasks: Task[];
  logs: TimeLog[];
  activeLog: TimeLog | null;
}

export class BasePage {
  public readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForSelector('#app-root-container', { timeout: 10000 });
  }

  async resetStorage() {
    await this.page.evaluate(() => {
      localStorage.removeItem('timelog_persistence_plugin_state');
      localStorage.removeItem('timelog_persistence_plugin_settings');
      localStorage.removeItem('timelog_persistence_plugin_runtime_configs');
      localStorage.removeItem('timelog_persistence_plugin_gui_variant');
    });
    await this.page.reload();
    await this.page.waitForSelector('#app-root-container', { timeout: 10000 });
  }

  async seedStorage(state: Partial<TimerRepositoryState>) {
    const defaultState: TimerRepositoryState = {
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    };
    const mergedState = { ...defaultState, ...state };

    await this.page.evaluate((data) => {
      localStorage.setItem('timelog_persistence_plugin_state', JSON.stringify(data));
    }, mergedState);

    await this.page.reload();
    await this.page.waitForSelector('#app-root-container', { timeout: 10000 });
  }
}

import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MainLayoutPage extends BasePage {
  // Locators
  readonly headerLogo: Locator;
  readonly tabMain: Locator;
  readonly tabReports: Locator;
  readonly tabDb: Locator;
  readonly tabOptions: Locator;

  readonly sizeSmallBtn: Locator;
  readonly sizeMediumBtn: Locator;
  readonly sizeLargeBtn: Locator;

  readonly idleTimerBanner: Locator;
  readonly activeTimerBanner: Locator;
  readonly activeTimerDisplay: Locator;
  readonly stopTimerBtn: Locator;

  readonly newProjectInput: Locator;
  readonly addProjectBtn: Locator;
  readonly projectsListContainer: Locator;

  readonly newTaskInput: Locator;
  readonly addTaskBtn: Locator;
  readonly tasksTreeContainer: Locator;

  constructor(page: Page) {
    super(page);

    // Header & Tabs
    this.headerLogo = page.locator('h1', { hasText: 'OxyFlow Client' });
    this.tabMain = page.locator('[data-testid="tab-main"]');
    this.tabReports = page.locator('[data-testid="tab-reports"]');
    this.tabDb = page.locator('[data-testid="tab-db"]');
    this.tabOptions = page.locator('[data-testid="tab-options"]');

    this.sizeSmallBtn = page.locator('[data-testid="gui-size-small"]');
    this.sizeMediumBtn = page.locator('[data-testid="gui-size-medium"]');
    this.sizeLargeBtn = page.locator('[data-testid="gui-size-large"]');

    // Timer Banner
    this.idleTimerBanner = page.locator('#active-timer-idle-banner');
    this.activeTimerBanner = page.locator('#active-timer-banner');
    this.activeTimerDisplay = page.locator('#active-timer-display');
    this.stopTimerBtn = page.locator('#stop-timer-btn');

    // Projects Sidebar
    this.newProjectInput = page.locator('#new-project-input');
    this.addProjectBtn = page.locator('#add-project-btn');
    this.projectsListContainer = page.locator('#projects-list-container');

    // Tasks ListView
    this.newTaskInput = page.locator('#new-task-input');
    this.addTaskBtn = page.locator('#add-task-btn');
    this.tasksTreeContainer = page.locator('#tasks-tree-container');
  }

  async switchGuiSize(size: 'small' | 'medium' | 'large') {
    if (size === 'small') {
      await this.sizeSmallBtn.click();
    } else if (size === 'medium') {
      await this.sizeMediumBtn.click();
    } else if (size === 'large') {
      await this.sizeLargeBtn.click();
    }
  }

  async switchTab(tabId: 'main' | 'reports' | 'db' | 'options') {
    if (tabId === 'main') {
      await this.tabMain.click();
    } else if (tabId === 'reports') {
      await this.tabReports.click();
    } else if (tabId === 'db') {
      await this.tabDb.click();
    } else if (tabId === 'options') {
      await this.tabOptions.click();
    }
  }

  async createProject(name: string, color?: string) {
    await this.newProjectInput.fill(name);
    if (color) {
      const colorBtn = this.page.locator(`#color-picker-${color}`);
      await colorBtn.click();
    }
    await this.addProjectBtn.click();
  }

  async selectProject(name: string) {
    const projectItem = this.page.locator('[id^="project-item-"]', { hasText: name });
    await projectItem.click();
  }

  async createTask(name: string) {
    await this.newTaskInput.fill(name);
    await this.addTaskBtn.click();
  }

  async startTimerForTask(taskId: string) {
    const startBtn = this.page.locator(`#start-btn-${taskId}`);
    await startBtn.click();
  }

  async stopActiveTimer() {
    await this.stopTimerBtn.click();
  }

  async toggleTaskComplete(taskId: string) {
    await this.page.locator(`#check-task-${taskId}`).click();
  }

  async deleteTask(taskId: string) {
    await this.page.locator(`#delete-task-btn-${taskId}`).click();
  }

  async editTaskName(taskId: string, newName: string) {
    await this.page.locator(`#edit-task-btn-${taskId}`).click();
    const input = this.page.locator('input[type="text"]:focus');
    await input.fill(newName);
    await input.press('Enter');
  }

  async createSubtask(parentTaskId: string, subtaskName: string) {
    await this.page.locator(`#show-subtask-form-btn-${parentTaskId}`).click();
    await this.page.locator(`#new-subtask-input-${parentTaskId}`).fill(subtaskName);
    await this.page.locator(`#submit-subtask-btn-${parentTaskId}`).click();
  }

  async toggleSubtaskComplete(subtaskId: string) {
    await this.page.locator(`#check-subtask-${subtaskId}`).click();
  }

  async startTimerForSubtask(subtaskId: string) {
    await this.page.locator(`#start-subtask-btn-${subtaskId}`).click();
  }

  async stopTimerForSubtask(subtaskId: string) {
    await this.page.locator(`#stop-subtask-btn-${subtaskId}`).click();
  }

  async toggleProjectArchive(projectId: string) {
    await this.page.locator(`#archive-project-btn-${projectId}`).click();
  }

  async editProjectName(projectId: string, newName: string) {
    await this.page.locator(`#edit-project-btn-${projectId}`).click();
    const modalInput = this.page.locator('input[type="text"][placeholder*="Nazwa"], input[type="text"]:focus');
    await modalInput.fill(newName);
    const saveBtn = this.page.locator('button', { hasText: /Zapisz|Save/i });
    if (await saveBtn.isVisible()) {
      await saveBtn.click();
    } else {
      await modalInput.press('Enter');
    }
  }
}

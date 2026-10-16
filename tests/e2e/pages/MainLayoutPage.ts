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
    this.headerLogo = page.locator('h1', { hasText: 'OxyFlow' });
    this.tabMain = page.locator('[data-testid="tab-main"]');
    this.tabReports = page.locator('[data-testid="tab-reports"]');
    this.tabDb = page.locator('[data-testid="tab-db"]');
    this.tabOptions = page.locator('[data-testid="tab-options"]');

    this.sizeSmallBtn = page.locator('[data-testid="layout-variant-compact"]:visible');
    this.sizeMediumBtn = page.locator('[data-testid="layout-variant-medium"]:visible');
    this.sizeLargeBtn = page.locator('[data-testid="layout-variant-full"]:visible');

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

  async switchLayoutVariant(variant: 'compact' | 'medium' | 'full') {
    await this.page.locator(`[data-testid="layout-variant-${variant}"]:visible`).click();
  }

  async switchTab(tabId: 'main' | 'reports' | 'db' | 'options') {
    await this.page.locator(`[data-testid="tab-${tabId}"]`).click();
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
    const modalInput = this.page.locator('#edit-project-name-input');
    await modalInput.fill(newName);
    await this.page.locator('#save-edit-project-btn').click();
  }
}

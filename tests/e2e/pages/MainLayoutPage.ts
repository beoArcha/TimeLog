import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MainLayoutPage extends BasePage {
  // Locators
  readonly headerLogo: Locator;
  readonly tabMain: Locator;
  readonly tabReports: Locator;
  readonly tabDb: Locator;
  readonly tabOptions: Locator;

  readonly sizeCompactBtn: Locator;
  readonly sizeMediumBtn: Locator;
  readonly sizeLargeBtn: Locator;

  readonly idleTimerBanner: Locator;
  readonly activeTimerBanner: Locator;
  readonly activeTimerDisplay: Locator;
  readonly stopTimerBtn: Locator;

  readonly newProjectInput: Locator;
  readonly addProjectBtn: Locator;
  readonly projectsListContainer: Locator;
  readonly projectEmptyState: Locator;

  readonly newTaskInput: Locator;
  readonly addTaskBtn: Locator;
  readonly tasksTreeContainer: Locator;

  readonly windowedFrame: Locator;
  readonly layoutHeader: Locator;
  readonly tabBarContainer: Locator;
  readonly tabBarScroll: Locator;
  readonly layoutMain: Locator;
  readonly layoutFooter: Locator;

  readonly confirmDialogConfirmBtn: Locator;
  readonly confirmDialogCancelBtn: Locator;

  constructor(page: Page) {
    super(page);

    // Header & Tabs
    this.headerLogo = page.locator('[data-testid="app-header-logo"]');
    this.tabMain = page.locator('[data-testid="tab-tasks"]');
    this.tabReports = page.locator('[data-testid="tab-reports"]');
    this.tabDb = page.locator('[data-testid="tab-db"]');
    this.tabOptions = page.locator('[data-testid="tab-settings"]');

    this.sizeCompactBtn = page.locator('[data-testid="layout-variant-compact"]:visible');
    this.sizeMediumBtn = page.locator('[data-testid="layout-variant-medium"]:visible');
    this.sizeLargeBtn = page.locator('[data-testid="layout-variant-full"]:visible');

    // Layout Sections & Frame
    this.windowedFrame = page.locator('[data-testid="windowed-frame"]');
    this.layoutHeader = page.locator('[data-testid="layout-header"]');
    this.tabBarContainer = page.locator('[data-testid="tab-bar-container"]');
    this.tabBarScroll = page.locator('[data-testid="tab-bar-scroll"]');
    this.layoutMain = page.locator('[data-testid="layout-main"]');
    this.layoutFooter = page.locator('[data-testid="layout-footer"]');

    // Timer Banner
    this.idleTimerBanner = page.locator('#active-timer-idle-banner');
    this.activeTimerBanner = page.locator('#active-timer-banner');
    this.activeTimerDisplay = page.locator('#active-timer-display');
    this.stopTimerBtn = page.locator('#stop-timer-btn');

    // Projects Sidebar
    this.newProjectInput = page.locator('#new-project-input');
    this.addProjectBtn = page.locator('#add-project-btn');
    this.projectsListContainer = page.locator('#projects-list-container');
    this.projectEmptyState = page.locator('[data-testid="project-empty-state"]');

    // Tasks ListView
    this.newTaskInput = page.locator('#new-task-input');
    this.addTaskBtn = page.locator('#add-task-btn');
    this.tasksTreeContainer = page.locator('#tasks-tree-container');

    // Confirm Dialog
    this.confirmDialogConfirmBtn = page.locator('[data-testid="confirm-dialog-confirm-btn"]');
    this.confirmDialogCancelBtn = page.locator('[data-testid="confirm-dialog-cancel-btn"]');
  }

  rootTaskCard(taskId: string): Locator {
    return this.page.locator(`#root-task-card-${taskId}`);
  }

  projectItem(projectId: string): Locator {
    return this.page.locator(`#project-item-${projectId}`);
  }

  async getElementContentMetrics(locator: Locator) {
    return locator.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const paddingLeft = parseFloat(style.paddingLeft) || 0;
      const paddingRight = parseFloat(style.paddingRight) || 0;
      return {
        rectLeft: rect.left,
        rectRight: rect.right,
        rectWidth: rect.width,
        paddingLeft,
        paddingRight,
        contentLeft: rect.left + paddingLeft,
        contentRight: rect.right - paddingRight,
        contentWidth: rect.width - paddingLeft - paddingRight,
      };
    });
  }

  async waitForLayoutStability(expectedWidth?: number) {
    await this.windowedFrame.waitFor({ state: 'visible' });
    await this.page.waitForFunction(
      (expWidth) => {
        const frame = document.querySelector('[data-testid="windowed-frame"]');
        if (!frame) return false;
        const rect = frame.getBoundingClientRect();
        if (expWidth !== undefined) {
          return Math.abs(rect.width - expWidth) <= 1;
        }
        return true;
      },
      expectedWidth,
      { timeout: 5000 }
    );
  }

  async switchLayoutVariant(variant: 'medium' | 'full') {
    await this.page.locator(`[data-testid="layout-variant-${variant}"]:visible`).click();
  }

  async switchTab(tabId: 'tasks' | 'reports' | 'settings') {
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
    const card = this.rootTaskCard(taskId);
    if (await card.isVisible()) {
      await card.hover();
    }
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
    const item = this.projectItem(projectId);
    if (await item.isVisible()) {
      await item.hover();
    }
    await this.page.locator(`#archive-project-btn-${projectId}`).click();
  }

  async editProjectName(projectId: string, newName: string) {
    const item = this.projectItem(projectId);
    if (await item.isVisible()) {
      await item.hover();
    }
    await this.page.locator(`#edit-project-btn-${projectId}`).click();
    const modalInput = this.page.locator('#edit-project-name-input');
    await modalInput.fill(newName);
    await this.page.locator('#save-edit-project-btn').click();
  }

  async confirmDialog() {
    await this.confirmDialogConfirmBtn.click();
  }

  async cancelDialog() {
    await this.confirmDialogCancelBtn.click();
  }
}

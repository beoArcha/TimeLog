import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class MediumLayoutPage extends BasePage {
  readonly mediumLayout: Locator;
  readonly tabTasksBtn: Locator;
  readonly tabReportsBtn: Locator;
  readonly tabSettingsBtn: Locator;

  readonly projectDropdownBtn: Locator;
  readonly openAddProjectBtn: Locator;
  readonly newProjectInput: Locator;
  readonly saveNewProjectBtn: Locator;
  readonly newProjectHeaderBtn: Locator;
  readonly toggleDockBtn: Locator;

  readonly newTaskInput: Locator;
  readonly addTaskBtn: Locator;
  readonly activeTimerBanner: Locator;
  readonly stopTimerBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.mediumLayout = page.locator('[data-testid="medium-layout"]');
    this.tabTasksBtn = page.locator('[data-testid="medium-tab-tasks"]');
    this.tabReportsBtn = page.locator('[data-testid="medium-tab-reports"]');
    this.tabSettingsBtn = page.locator('[data-testid="medium-tab-settings"]');

    this.projectDropdownBtn = page.locator('[data-testid="medium-project-dropdown-btn"]');
    this.openAddProjectBtn = page.locator('[data-testid="medium-open-add-project-btn"]');
    this.newProjectInput = page.locator('[data-testid="medium-new-project-input"]');
    this.saveNewProjectBtn = page.locator('[data-testid="medium-save-new-project-btn"]');
    this.newProjectHeaderBtn = page.locator('[data-testid="medium-new-project-btn"]');
    this.toggleDockBtn = page.locator('[data-testid="toggle-dock-btn"]');

    this.newTaskInput = page.locator('#new-task-input');
    this.addTaskBtn = page.locator('#add-task-btn');
    this.activeTimerBanner = page.locator('#active-timer-banner');
    this.stopTimerBtn = page.locator('#stop-timer-btn');
  }

  async selectTab(tab: 'tasks' | 'reports' | 'settings'): Promise<void> {
    const tabLocator = tab === 'tasks'
      ? this.tabTasksBtn
      : tab === 'reports'
        ? this.tabReportsBtn
        : this.tabSettingsBtn;
    await tabLocator.click();
  }

  async createProject(name: string): Promise<void> {
    await this.newProjectHeaderBtn.click();
    await this.newProjectInput.fill(name);
    await this.saveNewProjectBtn.click();
  }

  async selectProject(projectId: string): Promise<void> {
    await this.projectDropdownBtn.click();
    await this.page.locator(`[data-testid="medium-project-item-${projectId}"]`).click();
  }

  async createTask(name: string): Promise<void> {
    await this.newTaskInput.fill(name);
    await this.addTaskBtn.click();
  }

  async startTimerForTask(taskId: string): Promise<void> {
    await this.page.locator(`#start-btn-${taskId}`).click();
  }

  async stopActiveTimer(): Promise<void> {
    await this.stopTimerBtn.click();
  }

  async toggleDock(): Promise<void> {
    await this.toggleDockBtn.click();
  }
}

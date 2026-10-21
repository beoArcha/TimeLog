import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CompactWidgetPage extends BasePage {
  // Header Locators
  readonly headerTitle: Locator;
  readonly alwaysOnTopCheckbox: Locator;
  readonly restoreFullGuiBtn: Locator;
  readonly closeToTrayBtn: Locator;

  // Body Locators
  readonly activeProjectName: Locator;
  readonly toggleTasksBtn: Locator;
  readonly taskListContainer: Locator;

  constructor(page: Page) {
    super(page);

    this.headerTitle = page.locator('[data-testid="compact-header-title"]');
    this.alwaysOnTopCheckbox = page.locator('[data-testid="compact-always-on-top-checkbox"]');
    this.restoreFullGuiBtn = page.locator('[data-testid="compact-restore-btn"]');
    this.closeToTrayBtn = page.locator('[data-testid="compact-close-btn"]');

    this.activeProjectName = page.locator('h4', { hasText: /.+/ });
    this.toggleTasksBtn = page.locator('[data-testid="compact-toggle-tasks-btn"]');
    this.taskListContainer = page.locator('[data-testid="compact-tasks-drawer"]');
  }

  async toggleTaskList() {
    await this.toggleTasksBtn.click();
  }

  async toggleAlwaysOnTop(checked?: boolean) {
    const isChecked = await this.alwaysOnTopCheckbox.isChecked();
    if (checked === undefined || isChecked !== checked) {
      await this.alwaysOnTopCheckbox.click();
    }
  }

  async restoreFullGui() {
    await this.restoreFullGuiBtn.click();
  }

  async startTaskTimer(taskId: string) {
    await this.page.locator(`[data-testid="compact-timer-btn-${taskId}"]`).click();
  }

  async stopTaskTimer(taskId: string) {
    await this.page.locator(`[data-testid="compact-timer-btn-${taskId}"]`).click();
  }
}

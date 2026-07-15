import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  readonly tabOptionsBtn: Locator;
  readonly tabDbBtn: Locator;
  readonly dbExplorerPanel: Locator;
  readonly exportDbBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.tabOptionsBtn = page.locator('[data-testid="tab-options"]');
    this.tabDbBtn = page.locator('[data-testid="tab-db"]');
    this.dbExplorerPanel = page.locator('#db-explorer-panel');
    this.exportDbBtn = page.locator('[data-testid="export-db-btn"]');
  }

  async openOptionsTab() {
    await this.tabOptionsBtn.click();
  }

  async openDbTab() {
    await this.tabDbBtn.click();
  }
}

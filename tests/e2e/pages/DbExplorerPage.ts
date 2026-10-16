import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class DbExplorerPage extends BasePage {
  readonly tabDbBtn: Locator;
  readonly dbExplorerPanel: Locator;
  readonly exportDbBtn: Locator;
  readonly toggleDbInspectorBtn: Locator;
  readonly dbInspectorPanel: Locator;

  constructor(page: Page) {
    super(page);
    this.tabDbBtn = page.locator('[data-testid="tab-db"]');
    this.dbExplorerPanel = page.locator('#db-explorer-panel');
    this.exportDbBtn = page.locator('[data-testid="export-db-btn"]');
    this.toggleDbInspectorBtn = page.locator('#toggle-db-inspector-btn');
    this.dbInspectorPanel = page.locator('#db-inspector-panel');
  }

  async openDbExplorer(): Promise<void> {
    await this.tabDbBtn.waitFor({ state: 'visible' });
    await this.tabDbBtn.click();
    await this.dbExplorerPanel.waitFor({ state: 'visible' });
  }

  async toggleDbInspector(): Promise<void> {
    await this.toggleDbInspectorBtn.waitFor({ state: 'visible' });
    await this.toggleDbInspectorBtn.click();
  }
}

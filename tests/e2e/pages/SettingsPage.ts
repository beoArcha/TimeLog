import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class SettingsPage extends BasePage {
  readonly tabOptionsBtn: Locator;
  readonly destructiveZoneCard: Locator;
  readonly hardResetBtn: Locator;
  readonly resetDialogCancelBtn: Locator;
  readonly resetDialogConfirmBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.tabOptionsBtn = page.locator('[data-testid="tab-settings"]');
    this.destructiveZoneCard = page.locator('[data-testid="destructive-zone-card"]');
    this.hardResetBtn = page.locator('[data-testid="hard-reset-btn"]');
    this.resetDialogCancelBtn = page.locator('[data-testid="confirm-dialog-cancel-btn"]');
    this.resetDialogConfirmBtn = page.locator('[data-testid="confirm-dialog-confirm-btn"]');
  }

  async openOptionsTab() {
    await this.tabOptionsBtn.click();
  }

  async openHardResetDialog() {
    await this.destructiveZoneCard.click();
    await this.hardResetBtn.click();
  }
}

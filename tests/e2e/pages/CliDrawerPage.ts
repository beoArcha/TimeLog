import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class CliDrawerPage extends BasePage {
  readonly drawerWrapper: Locator;
  readonly drawerContainer: Locator;
  readonly drawerBackdrop: Locator;
  readonly closeBtn: Locator;
  readonly modeBadge: Locator;
  readonly terminalHistory: Locator;
  readonly cliInput: Locator;
  readonly cliSubmitBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.drawerWrapper = page.locator('#cli-drawer-wrapper');
    this.drawerContainer = page.locator('#cli-drawer-container');
    this.drawerBackdrop = page.locator('#cli-drawer-backdrop');
    this.closeBtn = page.locator('#cli-drawer-close-btn');
    this.modeBadge = page.locator('#cli-drawer-mode-badge');
    this.terminalHistory = page.locator('#terminal-history');
    this.cliInput = page.locator('#cli-input-field');
    this.cliSubmitBtn = page.locator('#cli-submit-btn');
  }

  async openDrawerViaShortcut(): Promise<void> {
    await this.page.keyboard.press('Control+Backquote');
  }

  async closeDrawerViaEsc(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }

  async closeDrawerViaBtn(): Promise<void> {
    await this.closeBtn.click();
  }

  async runCommand(cmd: string): Promise<void> {
    await this.cliInput.fill(cmd);
    await this.cliSubmitBtn.click();
  }

  async expectOutputContains(text: string): Promise<void> {
    await expect(this.terminalHistory).toContainText(text);
  }
}

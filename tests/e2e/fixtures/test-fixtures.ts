import { test as base } from '@playwright/test';
import { MainLayoutPage } from '../pages/MainLayoutPage';
import { ReportsPage } from '../pages/ReportsPage';
import { SettingsPage } from '../pages/SettingsPage';

type MyFixtures = {
  mainPage: MainLayoutPage;
  reportsPage: ReportsPage;
  settingsPage: SettingsPage;
};

export const test = base.extend<MyFixtures>({
  mainPage: async ({ page }, use) => {
    const mainPage = new MainLayoutPage(page);
    await mainPage.goto();
    await use(mainPage);
  },
  reportsPage: async ({ page }, use) => {
    const reportsPage = new ReportsPage(page);
    await reportsPage.goto();
    await use(reportsPage);
  },
  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await use(settingsPage);
  },
});

export { expect } from '@playwright/test';

import { test as base } from '@playwright/test';
import { MainLayoutPage } from '../pages/MainLayoutPage';

type MyFixtures = {
  mainPage: MainLayoutPage;
};

export const test = base.extend<MyFixtures>({
  mainPage: async ({ page }, use) => {
    const mainPage = new MainLayoutPage(page);
    await mainPage.goto();
    await use(mainPage);
  },
});

export { expect } from '@playwright/test';

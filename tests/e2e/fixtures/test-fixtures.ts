/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import { MainLayoutPage } from "../pages/MainLayoutPage";
import { ReportsPage } from "../pages/ReportsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { CompactWidgetPage } from "../pages/CompactWidgetPage";
import { DbExplorerPage } from "../pages/DbExplorerPage";
import { MediumLayoutPage } from "../pages/MediumLayoutPage";

type MyFixtures = {
  mainPage: MainLayoutPage;
  reportsPage: ReportsPage;
  settingsPage: SettingsPage;
  compactPage: CompactWidgetPage;
  dbExplorerPage: DbExplorerPage;
  mediumPage: MediumLayoutPage;
};

const blank_page_url = "about:blank";

export const test = base.extend<MyFixtures>({
  mainPage: async ({ page }, use) => {
    const mainPage = new MainLayoutPage(page);
    if (page.url() === blank_page_url) {
      await mainPage.goto();
    }
    await use(mainPage);
  },
  reportsPage: async ({ page }, use) => {
    const reportsPage = new ReportsPage(page);
    if (page.url() === blank_page_url) {
      await reportsPage.goto();
    }
    await use(reportsPage);
  },
  settingsPage: async ({ page }, use) => {
    const settingsPage = new SettingsPage(page);
    if (page.url() === blank_page_url) {
      await settingsPage.goto();
    }
    await use(settingsPage);
  },
  compactPage: async ({ page }, use) => {
    const compactPage = new CompactWidgetPage(page);
    if (page.url() === blank_page_url) {
      await compactPage.goto();
    }
    await use(compactPage);
  },
  dbExplorerPage: async ({ page }, use) => {
    const dbExplorerPage = new DbExplorerPage(page);
    if (page.url() === blank_page_url) {
      await dbExplorerPage.goto();
    }
    await use(dbExplorerPage);
  },
  mediumPage: async ({ page }, use) => {
    const mediumPage = new MediumLayoutPage(page);
    if (page.url() === blank_page_url) {
      await mediumPage.goto();
    }
    await use(mediumPage);
  },
});

export { expect } from "@playwright/test";

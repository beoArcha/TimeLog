import { Page, test as base } from "@playwright/test";
import { BasePage } from "../pages/BasePage";
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

type PageConstructor<T extends BasePage> = new (page: Page) => T;

/**
 * Generic fixture factory for Playwright page objects extending BasePage.
 * Automatically navigates to the application root if the page is currently on about:blank.
 */
function createPageFixture<T extends BasePage>(PageClass: PageConstructor<T>) {
  return async (
    { page }: { page: Page },
    use: (pageInstance: T) => Promise<void>,
  ) => {
    const pageInstance = new PageClass(page);
    if (page.url() === "about:blank") {
      await pageInstance.goto();
    }
    await use(pageInstance);
  };
}

export const test = base.extend<MyFixtures>({
  mainPage: createPageFixture(MainLayoutPage),
  reportsPage: createPageFixture(ReportsPage),
  settingsPage: createPageFixture(SettingsPage),
  compactPage: createPageFixture(CompactWidgetPage),
  dbExplorerPage: createPageFixture(DbExplorerPage),
  mediumPage: createPageFixture(MediumLayoutPage),
});

export { expect } from "@playwright/test";

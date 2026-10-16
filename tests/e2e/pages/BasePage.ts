import { Page } from "@playwright/test";
import { STORAGE_KEYS } from '@common/constants/storage-keys';
import {
  TimerRepositoryState,
  createDefaultState,
} from "../utils/state-seeder";

export type { TimerRepositoryState };

export interface SeedStorageOptions {
  currentProjectId?: string;
  guiVariant?: "full" | "medium" | "compact";
  locale?: string;
}

export class BasePage {
  public readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto("/", { waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("#app-root-container", { timeout: 15000 });
  }

  async resetStorage() {
    await this.page.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("oxytime_locale", "en");
      localStorage.setItem("oxytime_locale_pref", "en");
      localStorage.setItem("oxytime_gui_variant", "full");
    });
    await this.page.reload({ waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("#app-root-container", { timeout: 15000 });
  }

  async seedStorage(
    state: Partial<TimerRepositoryState>,
    options: SeedStorageOptions = {},
  ) {
    const mergedState = createDefaultState(state);
    const activeProjectId =
      options.currentProjectId ||
      (mergedState.projects.length > 0 ? mergedState.projects[0].id : "");
    const variant = options.guiVariant || "full";
    const locale = options.locale || "en";

    await this.page.evaluate(
      ({ data, keys, currentProjId, guiVar, loc }) => {
        localStorage.setItem(keys.STATE_DB, JSON.stringify(data));
        if (currentProjId) {
          localStorage.setItem(keys.CURRENT_PROJ_ID, currentProjId);
        } else {
          localStorage.removeItem(keys.CURRENT_PROJ_ID);
        }
        localStorage.setItem(keys.GUI_VARIANT, guiVar);
        localStorage.setItem(keys.LOCALE, loc);
        localStorage.setItem(keys.LOCALE_PREF, loc);
      },
      {
        data: mergedState,
        keys: STORAGE_KEYS,
        currentProjId: activeProjectId,
        guiVar: variant,
        loc: locale,
      },
    );

    await this.page.reload({ waitUntil: "domcontentloaded" });
    await this.page.waitForSelector("#app-root-container", { timeout: 15000 });
  }
}

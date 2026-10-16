import { test, expect } from '../fixtures/test-fixtures';
import { createMockProject, createMockTask } from '../utils/state-seeder';
import { TEST_IDS, TEST_NAMES, TEST_COLORS, TEST_DATES } from '../constants/test-constants';

test.describe('Persistence & Reload Resilience (E2E)', () => {
  const mockProject = createMockProject({
    id: TEST_IDS.PROJECT_RESILIENCE,
    name: TEST_NAMES.PROJECT_RESILIENCE,
    color: TEST_COLORS.EMERALD,
    createdAt: TEST_DATES.STATIC_TIMESTAMP,
    archived: false,
    description: TEST_NAMES.DESCRIPTION_DEFAULT,
    icon: '🛡️',
    tags: ['resilience', 'e2e'],
  });

  const mockTask = createMockTask({
    id: TEST_IDS.TASK_RESILIENCE,
    projectId: TEST_IDS.PROJECT_RESILIENCE,
    name: TEST_NAMES.TASK_RESILIENCE,
    createdAt: TEST_DATES.STATIC_TIMESTAMP,
    completed: false,
    status: 'Todo',
  });

  test('should preserve active timer state and continue tracking across page reloads', async ({ mainPage, page }) => {
    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    });

    await mainPage.selectProject(TEST_NAMES.PROJECT_RESILIENCE);
    await expect(mainPage.idleTimerBanner).toBeVisible();

    // Start timer on task
    await mainPage.startTimerForTask(TEST_IDS.TASK_RESILIENCE);
    await expect(mainPage.activeTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toContainText(TEST_NAMES.TASK_RESILIENCE);

    // Reload page to simulate browser refresh / app restart
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app-root-container', { timeout: 15000 });

    // Verify active timer is still running and visible after reload
    await expect(mainPage.activeTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toContainText(TEST_NAMES.TASK_RESILIENCE);
    await expect(mainPage.activeTimerDisplay).toBeVisible();
    await expect(mainPage.idleTimerBanner).toBeHidden();

    // Stop timer after reload
    await mainPage.stopActiveTimer();
    await expect(mainPage.idleTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toBeHidden();
  });

  test('should persist chosen layout variant across page reloads', async ({ mainPage, page }) => {
    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    });

    // Switch to medium layout
    await mainPage.switchLayoutVariant('medium');
    await expect(mainPage.tabMain).toBeHidden();

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app-root-container', { timeout: 15000 });

    // Medium layout should remain active
    await expect(mainPage.tabMain).toBeHidden();

    // Switch back to full layout
    await mainPage.switchLayoutVariant('full');
    await expect(mainPage.tabMain).toBeVisible();

    // Reload page again
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app-root-container', { timeout: 15000 });

    // Full layout should remain active
    await expect(mainPage.tabMain).toBeVisible();
  });

  test('should persist language setting across page reloads', async ({ mainPage, page }) => {
    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    });

    // Seed German locale in standard storage keys
    await page.evaluate(() => {
      localStorage.setItem('oxytime_locale', 'de');
      localStorage.setItem('oxytime_locale_pref', 'de');
    });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app-root-container', { timeout: 15000 });

    // Verify UI reflects German translations
    const mainTab = page.locator('[data-testid="tab-main"]');
    await expect(mainTab).toBeVisible();
    await expect(mainTab).toContainText('GUI-Schnittstelle');
  });
});

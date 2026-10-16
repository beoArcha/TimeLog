import { test, expect } from '../fixtures/test-fixtures';
import {
  createDefaultState,
  createMockProject,
  createMockTask,
  createMockTimeLog,
} from '../utils/state-seeder';
import {
  TEST_IDS,
  TEST_NAMES,
  TEST_COLORS,
  TEST_DATES,
} from '../constants/test-constants';

test.describe('Database Explorer & Inspector Deep E2E Suite', () => {
  test.beforeEach(async ({ page, dbExplorerPage }) => {
    const initialState = createDefaultState({
      projects: [
        createMockProject({
          id: TEST_IDS.PROJECT_DB_EXPLORER,
          name: TEST_NAMES.PROJECT_DB_EXPLORER,
          color: TEST_COLORS.EMERALD,
        }),
      ],
      tasks: [
        createMockTask({
          id: TEST_IDS.TASK_DB_EXPLORER,
          projectId: TEST_IDS.PROJECT_DB_EXPLORER,
          name: TEST_NAMES.TASK_DB_EXPLORER,
        }),
      ],
      logs: [
        createMockTimeLog({
          id: TEST_IDS.LOG_ANALYTICS,
          taskId: TEST_IDS.TASK_DB_EXPLORER,
          projectId: TEST_IDS.PROJECT_DB_EXPLORER,
          startTime: TEST_DATES.LOG_START,
          endTime: TEST_DATES.LOG_END,
        }),
      ],
    });

    await dbExplorerPage.seedStorage(initialState);
    await page.reload();
  });

  test('should display database explorer tables and seeded records', async ({
    dbExplorerPage,
  }) => {
    await dbExplorerPage.openDbExplorer();

    await expect(dbExplorerPage.dbExplorerPanel).toBeVisible();

    const seededProjectCell = dbExplorerPage.page.locator('td', {
      hasText: TEST_NAMES.PROJECT_DB_EXPLORER,
    });
    await expect(seededProjectCell).toBeVisible();

    const seededTaskCell = dbExplorerPage.page.locator('td', {
      hasText: TEST_NAMES.TASK_DB_EXPLORER,
    });
    await expect(seededTaskCell).toBeVisible();

    const seededLogCell = dbExplorerPage.page.locator('td', {
      hasText: TEST_IDS.LOG_ANALYTICS,
    });
    await expect(seededLogCell).toBeVisible();
  });

  test('should trigger database JSON backup export', async ({
    dbExplorerPage,
  }) => {
    await dbExplorerPage.openDbExplorer();

    const downloadPromise = dbExplorerPage.page.waitForEvent('download');
    await dbExplorerPage.exportDbBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^OxyFlow_Backup_.*\.json$/);
  });

  test('should toggle database inspector preview panel on main layout', async ({
    mainPage,
    dbExplorerPage,
  }) => {
    await mainPage.switchTab('main');

    await expect(dbExplorerPage.toggleDbInspectorBtn).toBeVisible();
    await expect(dbExplorerPage.dbInspectorPanel).not.toBeVisible();

    await dbExplorerPage.toggleDbInspector();
    await expect(dbExplorerPage.dbInspectorPanel).toBeVisible();

    await expect(
      dbExplorerPage.page.locator('#db-inspector-panel', {
        hasText: 'TABLE projects',
      }),
    ).toBeVisible();
    await expect(
      dbExplorerPage.page.locator('#db-inspector-panel', {
        hasText: 'TABLE tasks',
      }),
    ).toBeVisible();
    await expect(
      dbExplorerPage.page.locator('#db-inspector-panel', {
        hasText: 'TABLE time_logs',
      }),
    ).toBeVisible();

    await dbExplorerPage.toggleDbInspector();
    await expect(dbExplorerPage.dbInspectorPanel).not.toBeVisible();
  });

  test('should handle database reset modal cancelation and confirmation in settings', async ({
    mainPage,
    page,
  }) => {
    await mainPage.switchTab('options');

    const destructiveSection = page.locator('[data-testid="destructive-zone-card"]');
    await destructiveSection.click();

    const hardResetBtn = page.locator('[data-testid="hard-reset-btn"]');
    await expect(hardResetBtn).toBeVisible();
    await hardResetBtn.click();

    const promptInput = page.locator('[data-testid="prompt-dialog-input"]');
    await expect(promptInput).toBeVisible();

    const cancelBtn = page.locator('[data-testid="prompt-dialog-cancel-btn"]');
    await cancelBtn.click();
    await expect(promptInput).not.toBeVisible();

    await hardResetBtn.click();
    await promptInput.fill('reset');
    const confirmBtn = page.locator('[data-testid="prompt-dialog-confirm-btn"]');
    await confirmBtn.click();

    await mainPage.switchTab('main');
    const tasksCount = await page.locator('[id^="task-item-"]').count();
    expect(tasksCount).toBe(0);
  });
});

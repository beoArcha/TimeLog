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

test.describe('Backup and Restore E2E Suite', () => {
  test.beforeEach(async ({ page, mainPage }) => {
    const initialState = createDefaultState({
      projects: [
        createMockProject({
          id: TEST_IDS.PROJECT_ALPHA,
          name: TEST_NAMES.PROJECT_ALPHA,
          color: TEST_COLORS.EMERALD,
        }),
      ],
      tasks: [
        createMockTask({
          id: TEST_IDS.TASK_ALPHA,
          projectId: TEST_IDS.PROJECT_ALPHA,
          name: TEST_NAMES.TASK_ALPHA,
        }),
      ],
      logs: [
        createMockTimeLog({
          id: TEST_IDS.LOG_ANALYTICS,
          taskId: TEST_IDS.TASK_ALPHA,
          projectId: TEST_IDS.PROJECT_ALPHA,
          startTime: TEST_DATES.LOG_START,
          endTime: TEST_DATES.LOG_END,
        }),
      ],
    });

    await mainPage.seedStorage(initialState);
    await page.reload();
  });

  test('should export database backup, clear state via reset, and restore from exported JSON', async ({
    page,
    mainPage,
  }) => {
    // 1. Verify initial seeded task is on main layout
    await mainPage.switchTab('main');
    await expect(page.locator(`text=${TEST_NAMES.TASK_ALPHA}`)).toBeVisible();

    // 2. Navigate to Backup tab
    const backupTabBtn = page.locator('[data-testid="tab-backup"]');
    await expect(backupTabBtn).toBeVisible();
    await backupTabBtn.click();

    // 3. Export backup and capture downloaded JSON
    const exportBtn = page.locator('[data-testid="export-backup-btn"]');
    await expect(exportBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await exportBtn.click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/^OxyFlow_Backup_.*\.json$/);

    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    if (stream) {
      for await (const chunk of stream) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
    }
    const backupJsonBuffer = Buffer.concat(chunks);
    const parsedPayload = JSON.parse(backupJsonBuffer.toString('utf-8'));
    expect(parsedPayload.version).toBe(1);
    expect(parsedPayload.projects).toHaveLength(1);
    expect(parsedPayload.projects[0].name).toBe(TEST_NAMES.PROJECT_ALPHA);

    // 4. Reset database via Settings tab
    await mainPage.switchTab('options');

    const destructiveSection = page.locator('[data-testid="destructive-zone-card"]');
    await destructiveSection.click();

    const hardResetBtn = page.locator('[data-testid="hard-reset-btn"]');
    await hardResetBtn.click();

    const promptInput = page.locator('[data-testid="prompt-dialog-input"]');
    await promptInput.fill('reset');

    const confirmBtn = page.locator('[data-testid="prompt-dialog-confirm-btn"]');
    await confirmBtn.click();

    // 5. Verify database cleared on main screen
    await mainPage.switchTab('main');
    await expect(page.locator(`text=${TEST_NAMES.TASK_ALPHA}`)).not.toBeVisible();

    // 6. Navigate back to Backup tab and restore from the downloaded buffer
    await backupTabBtn.click();

    const importInput = page.locator('[data-testid="import-backup-input"]');
    await importInput.setInputFiles({
      name: 'OxyFlow_Backup_Test.json',
      mimeType: 'application/json',
      buffer: backupJsonBuffer,
    });

    // 7. Verify restored task appears on screen after restore
    await mainPage.switchTab('main');
    await expect(page.locator(`text=${TEST_NAMES.TASK_ALPHA}`)).toBeVisible();
  });
});

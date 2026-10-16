import { test, expect } from '../fixtures/test-fixtures';
import { createMockProject, createMockTask } from '../utils/state-seeder';
import { TEST_IDS, TEST_NAMES, TEST_COLORS, TEST_DATES } from '../constants/test-constants';

test.describe('Timer Live Measurement and Banner Synchronization (E2E)', () => {
  const mockProject = createMockProject({
    id: TEST_IDS.PROJECT_SEEDED,
    name: TEST_NAMES.PROJECT_SEEDED,
    color: TEST_COLORS.VIOLET,
    createdAt: TEST_DATES.STATIC_TIMESTAMP,
  });

  const mockTask = createMockTask({
    id: TEST_IDS.TASK_SEEDED,
    projectId: TEST_IDS.PROJECT_SEEDED,
    name: TEST_NAMES.TASK_SEEDED,
    createdAt: TEST_DATES.STATIC_TIMESTAMP,
    completed: false,
  });

  test.beforeEach(async ({ mainPage }) => {
    await mainPage.resetStorage();
    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    }, { currentProjectId: TEST_IDS.PROJECT_SEEDED });
  });

  test('should reactively count elapsed seconds in the banner without page reload', async ({ page }) => {
    // Initial state: idle banner is visible, active banner is hidden
    const idleBanner = page.locator('#active-timer-idle-banner');
    const activeBanner = page.locator('#active-timer-banner');
    const startBtn = page.locator(`#start-btn-${TEST_IDS.TASK_SEEDED}`);
    const stopBtn = page.locator(`#stop-btn-${TEST_IDS.TASK_SEEDED}`);

    await expect(idleBanner).toBeVisible();
    await expect(activeBanner).toBeHidden();
    await expect(startBtn).toBeVisible();

    // Start timer from task row
    await startBtn.click();

    // Active banner appears and task button changes to stop
    await expect(activeBanner).toBeVisible();
    await expect(stopBtn).toBeVisible();
    await expect(startBtn).toBeHidden();

    const timerDisplay = page.locator('#active-timer-display');
    await expect(timerDisplay).toBeVisible();

    const initialText = await timerDisplay.innerText();

    // Wait 2.2 seconds for the timer tick
    await page.waitForTimeout(2200);

    const updatedText = await timerDisplay.innerText();
    expect(updatedText).not.toEqual(initialText);

    // Stop timer from active banner stop button
    const bannerStopBtn = page.locator('#stop-timer-btn');
    await expect(bannerStopBtn).toBeVisible();
    await bannerStopBtn.click();

    // Idle banner restored and task button turns back to start
    await expect(activeBanner).toBeHidden();
    await expect(idleBanner).toBeVisible();
    await expect(startBtn).toBeVisible();
  });

  test('should synchronize timer state across task item button and active banner', async ({ page }) => {
    const activeBanner = page.locator('#active-timer-banner');
    const startBtn = page.locator(`#start-btn-${TEST_IDS.TASK_SEEDED}`);
    const stopBtn = page.locator(`#stop-btn-${TEST_IDS.TASK_SEEDED}`);

    // Start timer via task item
    await startBtn.click();
    await expect(activeBanner).toBeVisible();
    await expect(activeBanner).toContainText(TEST_NAMES.TASK_SEEDED);
    await expect(activeBanner).toContainText(TEST_NAMES.PROJECT_SEEDED);

    // Stop timer directly via task item stop button
    await stopBtn.click();
    await expect(activeBanner).toBeHidden();
    await expect(startBtn).toBeVisible();
  });
});

import { test, expect } from '../fixtures/test-fixtures';
import {
  createDefaultState,
  createMockProject,
  createMockTask,
} from '../utils/state-seeder';
import {
  TEST_IDS,
  TEST_NAMES,
  TEST_COLORS,
} from '../constants/test-constants';

test.describe('Medium Layout Specialized View E2E Suite', () => {
  test.beforeEach(async ({ page, mainPage }) => {
    const initialState = createDefaultState({
      projects: [
        createMockProject({
          id: TEST_IDS.PROJECT_MEDIUM,
          name: TEST_NAMES.PROJECT_MEDIUM,
          color: TEST_COLORS.VIOLET,
        }),
      ],
      tasks: [
        createMockTask({
          id: TEST_IDS.TASK_MEDIUM,
          projectId: TEST_IDS.PROJECT_MEDIUM,
          name: TEST_NAMES.TASK_MEDIUM,
        }),
      ],
      logs: [],
    });

    await mainPage.seedStorage(initialState);
    await page.reload();
    await mainPage.switchLayoutVariant('medium');
  });

  test('should render medium layout and perform complete task and timer lifecycle', async ({
    mediumPage,
    page,
  }) => {
    await expect(mediumPage.mediumLayout).toBeVisible();

    const taskItem = page.locator(`#root-task-card-${TEST_IDS.TASK_MEDIUM}`);
    await expect(taskItem).toBeVisible();

    // Start timer for task in medium view
    await mediumPage.startTimerForTask(TEST_IDS.TASK_MEDIUM);
    await expect(mediumPage.activeTimerBanner).toBeVisible();

    // Stop active timer
    await mediumPage.stopActiveTimer();
    await expect(mediumPage.activeTimerBanner).not.toBeVisible();

    // Create a new task within the medium layout
    const newTaskName = 'Medium Ad-hoc Workflow Task';
    await mediumPage.createTask(newTaskName);
    const newTaskLocator = page.locator('[id^="root-task-card-"]', {
      hasText: newTaskName,
    });
    await expect(newTaskLocator).toBeVisible();
  });

  test('should navigate across bottom navigation tabs in medium layout', async ({
    mediumPage,
    page,
  }) => {
    await expect(mediumPage.mediumLayout).toBeVisible();

    // Switch to Reports tab
    await mediumPage.selectTab('reports');
    await expect(page.locator('#reports-panel')).toBeVisible();

    // Switch to Settings tab
    await mediumPage.selectTab('settings');
    await expect(page.locator('#toggle-db-inspector-btn')).toBeVisible();

    // Switch back to Tasks tab
    await mediumPage.selectTab('tasks');
    await expect(page.locator('#tasks-main')).toBeVisible();
    await expect(page.locator(`#root-task-card-${TEST_IDS.TASK_MEDIUM}`)).toBeVisible();
  });

  test('should toggle sidebar dock position between right and left', async ({
    mediumPage,
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(mediumPage.mediumLayout).toBeVisible();

    await expect(mediumPage.toggleDockBtn).toBeVisible();
    await expect(mediumPage.toggleDockBtn).toHaveAttribute('aria-pressed', 'false');

    // Toggle dock to left
    await mediumPage.toggleDock();
    await expect(mediumPage.toggleDockBtn).toHaveAttribute('aria-pressed', 'true');

    // Toggle dock back to right
    await mediumPage.toggleDock();
    await expect(mediumPage.toggleDockBtn).toHaveAttribute('aria-pressed', 'false');
  });
});

import { test, expect } from '../fixtures/test-fixtures';
import { createMockProject, createMockTask } from '../utils/state-seeder';
import { TEST_IDS, TEST_NAMES, TEST_COLORS, TEST_DATES, TEST_LABELS } from '../constants/test-constants';

test.describe('Compact Widget Layout Workflows (E2E)', () => {
  const mockProject = createMockProject({
    id: TEST_IDS.PROJECT_COMPACT,
    name: TEST_NAMES.PROJECT_COMPACT,
    color: TEST_COLORS.ORANGE,
    createdAt: TEST_DATES.STATIC_TIMESTAMP,
    archived: false,
    description: TEST_NAMES.DESCRIPTION_DEFAULT,
    icon: '⚡',
    tags: ['compact', 'e2e'],
  });

  const mockTask = createMockTask({
    id: TEST_IDS.TASK_COMPACT,
    projectId: TEST_IDS.PROJECT_COMPACT,
    name: TEST_NAMES.TASK_COMPACT,
    createdAt: TEST_DATES.STATIC_TIMESTAMP,
    completed: false,
    status: 'Todo',
  });

  test.beforeEach(async ({ mainPage }) => {
    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    });
  });

  test('should switch from full layout to compact layout and render compact widget elements', async ({ mainPage, compactPage }) => {
    // Initially in full layout
    await expect(mainPage.tabMain).toBeVisible();
    await expect(mainPage.projectsListContainer).toBeVisible();

    // Switch to compact layout
    await mainPage.switchLayoutVariant('compact');

    // Full layout tabs and project sidebar should be hidden
    await expect(mainPage.tabMain).toBeHidden();
    await expect(mainPage.projectsListContainer).toBeHidden();

    // Compact widget elements should be visible
    await expect(compactPage.headerTitle).toBeVisible();
    await expect(compactPage.alwaysOnTopCheckbox).toBeVisible();
    await expect(compactPage.restoreFullGuiBtn).toBeVisible();
    await expect(compactPage.closeToTrayBtn).toBeVisible();
    await expect(compactPage.toggleTasksBtn).toBeVisible();
  });

  test('should expand and collapse the tasks list in compact mode', async ({ mainPage, compactPage }) => {
    await mainPage.switchLayoutVariant('compact');

    // Tasks list drawer is expanded by default
    await expect(compactPage.taskListContainer).toBeVisible();
    await expect(compactPage.page.locator('span', { hasText: TEST_NAMES.TASK_COMPACT })).toBeVisible();

    // Collapse tasks list
    await compactPage.toggleTaskList();
    await expect(compactPage.taskListContainer).toBeHidden();

    // Expand tasks list again
    await compactPage.toggleTaskList();
    await expect(compactPage.taskListContainer).toBeVisible();
    await expect(compactPage.page.locator('span', { hasText: TEST_NAMES.TASK_COMPACT })).toBeVisible();
  });

  test('should start and stop timer directly from compact mode task card', async ({ mainPage, compactPage }) => {
    await mainPage.switchLayoutVariant('compact');

    // Verify task is visible in expanded compact drawer
    const taskCard = compactPage.page.locator(`[data-testid="compact-task-card-${TEST_IDS.TASK_COMPACT}"]`);
    await expect(taskCard).toBeVisible();
    await expect(taskCard).toContainText(TEST_NAMES.TASK_COMPACT);

    const timerBtn = compactPage.page.locator(`[data-testid="compact-timer-btn-${TEST_IDS.TASK_COMPACT}"]`);
    await expect(timerBtn).toBeVisible();

    // Start timer on task in compact mode
    await compactPage.startTaskTimer(TEST_IDS.TASK_COMPACT);

    // Timer button should indicate stop state
    await expect(timerBtn).toHaveAttribute('aria-label', TEST_LABELS.STOP_MEASUREMENT);

    // Stop timer
    await compactPage.stopTaskTimer(TEST_IDS.TASK_COMPACT);

    // Timer button should indicate start state
    await expect(timerBtn).toHaveAttribute('aria-label', TEST_LABELS.START_MEASUREMENT);
  });

  test('should toggle Always on Top checkbox in compact mode', async ({ mainPage, compactPage }) => {
    await mainPage.switchLayoutVariant('compact');

    await expect(compactPage.alwaysOnTopCheckbox).not.toBeChecked();

    // Toggle on
    await compactPage.toggleAlwaysOnTop(true);
    await expect(compactPage.alwaysOnTopCheckbox).toBeChecked();

    // Toggle off
    await compactPage.toggleAlwaysOnTop(false);
    await expect(compactPage.alwaysOnTopCheckbox).not.toBeChecked();
  });

  test('should restore full GUI mode when clicking restore button in compact mode', async ({ mainPage, compactPage }) => {
    await mainPage.switchLayoutVariant('compact');
    await expect(mainPage.tabMain).toBeHidden();

    // Click restore button in compact header
    await compactPage.restoreFullGui();

    // Verify full layout is restored
    await expect(mainPage.tabMain).toBeVisible();
    await expect(mainPage.projectsListContainer).toBeVisible();
  });
});

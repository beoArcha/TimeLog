import { test, expect } from '../fixtures/test-fixtures';
import { createMockProject, createMockTask, createMockTimeLog } from '../utils/state-seeder';
import { TEST_IDS, TEST_NAMES, TEST_COLORS, TEST_DATES } from '../constants/test-constants';

test.describe('Reports and Database Explorer Navigation (E2E)', () => {
  test('should navigate to reports tab and switch analytical period filters and sort options', async ({ reportsPage }) => {
    const mockProject = createMockProject({
      id: TEST_IDS.PROJECT_ANALYTICS,
      name: TEST_NAMES.PROJECT_ANALYTICS,
      color: TEST_COLORS.VIOLET,
      createdAt: TEST_DATES.STATIC_TIMESTAMP,
      archived: false,
    });

    const mockTask = createMockTask({
      id: TEST_IDS.TASK_ANALYTICS,
      projectId: TEST_IDS.PROJECT_ANALYTICS,
      name: TEST_NAMES.TASK_ANALYTICS,
      createdAt: TEST_DATES.STATIC_TIMESTAMP,
      completed: false,
      status: 'Todo',
    });

    const mockLog = createMockTimeLog({
      id: TEST_IDS.LOG_ANALYTICS,
      taskId: TEST_IDS.TASK_ANALYTICS,
      projectId: TEST_IDS.PROJECT_ANALYTICS,
      startTime: TEST_DATES.LOG_START,
      endTime: TEST_DATES.LOG_END,
    });

    await reportsPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [mockLog],
      activeLog: null,
    });

    await reportsPage.openReportsTab();
    await expect(reportsPage.reportsPanel).toBeVisible();

    await reportsPage.selectPeriod('week');
    await expect(reportsPage.periodWeekBtn).toHaveAttribute('aria-pressed', 'true');

    await reportsPage.selectPeriod('month');
    await expect(reportsPage.periodMonthBtn).toHaveAttribute('aria-pressed', 'true');

    await reportsPage.selectSortOrder('date');
    await expect(reportsPage.reportSortSelect).toHaveValue('date');
  });

  test('should navigate to database explorer tab and display database export action and tables', async ({ settingsPage }) => {
    await settingsPage.openDbTab();
    await expect(settingsPage.dbExplorerPanel).toBeVisible();
    await expect(settingsPage.exportDbBtn).toBeVisible();
  });
});

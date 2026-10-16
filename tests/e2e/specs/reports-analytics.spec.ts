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
} from '../constants/test-constants';

test.describe('Reports & Analytical Dashboards E2E Suite', () => {
  const ONE_HOUR_MS = 3600 * 1000;
  const TWO_HOURS_MS = 7200 * 1000;

  test('should compute summary cards and graphical distribution for today logs', async ({
    reportsPage,
    page,
  }) => {
    const now = Date.now();
    const todayLogStart = new Date(now - ONE_HOUR_MS).toISOString();
    const todayLogEnd = new Date(now).toISOString();

    const initialState = createDefaultState({
      projects: [
        createMockProject({
          id: TEST_IDS.PROJECT_ANALYTICS,
          name: TEST_NAMES.PROJECT_ANALYTICS,
          color: TEST_COLORS.ORANGE,
        }),
      ],
      tasks: [
        createMockTask({
          id: TEST_IDS.TASK_ANALYTICS,
          projectId: TEST_IDS.PROJECT_ANALYTICS,
          name: TEST_NAMES.TASK_ANALYTICS,
        }),
      ],
      logs: [
        createMockTimeLog({
          id: TEST_IDS.LOG_ANALYTICS,
          taskId: TEST_IDS.TASK_ANALYTICS,
          projectId: TEST_IDS.PROJECT_ANALYTICS,
          startTime: todayLogStart,
          endTime: todayLogEnd,
        }),
      ],
    });

    await reportsPage.seedStorage(initialState);
    await page.reload();
    await reportsPage.openReportsTab();

    await expect(reportsPage.reportsPanel).toBeVisible();

    const todayDurationCell = page.locator('#reports-panel', {
      hasText: '01:00:00',
    });
    await expect(todayDurationCell).toBeVisible();

    const graphicalProject = page.locator('#reports-panel', {
      hasText: TEST_NAMES.PROJECT_ANALYTICS,
    });
    await expect(graphicalProject).toBeVisible();

    const taskInDump = page.locator('#reports-panel', {
      hasText: `"${TEST_NAMES.TASK_ANALYTICS}"`,
    });
    await expect(taskInDump).toBeVisible();
  });

  test('should filter logs and display empty state when no logs match selected period', async ({
    reportsPage,
    page,
  }) => {
    const sixtyDaysAgo = Date.now() - 60 * 24 * 3600 * 1000;
    const oldLogStart = new Date(sixtyDaysAgo).toISOString();
    const oldLogEnd = new Date(sixtyDaysAgo + TWO_HOURS_MS).toISOString();

    const initialState = createDefaultState({
      projects: [
        createMockProject({
          id: TEST_IDS.PROJECT_ANALYTICS,
          name: TEST_NAMES.PROJECT_ANALYTICS,
          color: TEST_COLORS.VIOLET,
        }),
      ],
      tasks: [
        createMockTask({
          id: TEST_IDS.TASK_ANALYTICS,
          projectId: TEST_IDS.PROJECT_ANALYTICS,
          name: TEST_NAMES.TASK_ANALYTICS,
        }),
      ],
      logs: [
        createMockTimeLog({
          id: TEST_IDS.LOG_ANALYTICS,
          taskId: TEST_IDS.TASK_ANALYTICS,
          projectId: TEST_IDS.PROJECT_ANALYTICS,
          startTime: oldLogStart,
          endTime: oldLogEnd,
        }),
      ],
    });

    await reportsPage.seedStorage(initialState);
    await page.reload();
    await reportsPage.openReportsTab();

    await reportsPage.selectPeriod('today');
    await expect(reportsPage.periodTodayBtn).toHaveAttribute('aria-pressed', 'true');

    const emptyWarning = page.locator('#reports-panel', {
      hasText: /⚠️/i,
    });
    await expect(emptyWarning).toBeVisible();

    await reportsPage.selectPeriod('all');
    await expect(reportsPage.periodAllBtn).toHaveAttribute('aria-pressed', 'true');

    const taskInDump = page.locator('#reports-panel', {
      hasText: `"${TEST_NAMES.TASK_ANALYTICS}"`,
    });
    await expect(taskInDump).toBeVisible();
    await expect(emptyWarning).not.toBeVisible();
  });

  test('should toggle sort order between duration and chronological date', async ({
    reportsPage,
    page,
  }) => {
    const now = Date.now();
    const firstLogStart = new Date(now - 10 * ONE_HOUR_MS).toISOString();
    const firstLogEnd = new Date(now - 9 * ONE_HOUR_MS).toISOString(); // 1 hour

    const secondLogStart = new Date(now - 2 * ONE_HOUR_MS).toISOString();
    const secondLogEnd = new Date(now).toISOString(); // 2 hours

    const initialState = createDefaultState({
      projects: [
        createMockProject({
          id: TEST_IDS.PROJECT_ANALYTICS,
          name: TEST_NAMES.PROJECT_ANALYTICS,
          color: TEST_COLORS.BLUE,
        }),
      ],
      tasks: [
        createMockTask({
          id: 'task-short',
          projectId: TEST_IDS.PROJECT_ANALYTICS,
          name: 'Short Task 1h',
        }),
        createMockTask({
          id: 'task-long',
          projectId: TEST_IDS.PROJECT_ANALYTICS,
          name: 'Long Task 2h',
        }),
      ],
      logs: [
        createMockTimeLog({
          id: 'log-short',
          taskId: 'task-short',
          projectId: TEST_IDS.PROJECT_ANALYTICS,
          startTime: firstLogStart,
          endTime: firstLogEnd,
        }),
        createMockTimeLog({
          id: 'log-long',
          taskId: 'task-long',
          projectId: TEST_IDS.PROJECT_ANALYTICS,
          startTime: secondLogStart,
          endTime: secondLogEnd,
        }),
      ],
    });

    await reportsPage.seedStorage(initialState);
    await page.reload();
    await reportsPage.openReportsTab();
    await reportsPage.selectPeriod('all');

    // Default sort is duration descending: Long Task 2h should be first
    await reportsPage.selectSortOrder('duration');
    const firstItemDuration = page.locator('#reports-panel .overflow-y-auto > div').first();
    await expect(firstItemDuration).toContainText('Long Task 2h');

    // Change sort to chronological date: Short Task (started 10h ago) should be first
    await reportsPage.selectSortOrder('date');
    const firstItemDate = page.locator('#reports-panel .overflow-y-auto > div').first();
    await expect(firstItemDate).toContainText('Short Task 1h');
  });
});

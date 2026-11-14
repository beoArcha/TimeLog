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

  test.describe('multi-project report scope', () => {
    const SCOPE_PROJECTS = [
      { projectId: 'proj-scope-a', taskId: 'task-scope-a', taskName: 'Scope Task A', hoursAgo: 6, hours: 1 },
      { projectId: 'proj-scope-b', taskId: 'task-scope-b', taskName: 'Scope Task B', hoursAgo: 4, hours: 2 },
      { projectId: 'proj-scope-c', taskId: 'task-scope-c', taskName: 'Scope Task C', hoursAgo: 8, hours: 3 },
    ] as const;

    test.beforeEach(async ({ reportsPage, page }) => {
      const now = Date.now();
      const initialState = createDefaultState({
        projects: SCOPE_PROJECTS.map((s) =>
          createMockProject({ id: s.projectId, name: `Scope Project ${s.taskName.slice(-1)}`, color: TEST_COLORS.BLUE })
        ),
        tasks: SCOPE_PROJECTS.map((s) =>
          createMockTask({ id: s.taskId, projectId: s.projectId, name: s.taskName })
        ),
        logs: SCOPE_PROJECTS.map((s) =>
          createMockTimeLog({
            id: `log-${s.taskId}`,
            taskId: s.taskId,
            projectId: s.projectId,
            startTime: new Date(now - s.hoursAgo * ONE_HOUR_MS).toISOString(),
            endTime: new Date(now - (s.hoursAgo - s.hours) * ONE_HOUR_MS).toISOString(),
          })
        ),
      });

      await reportsPage.seedStorage(initialState);
      await page.reload();
      await reportsPage.openReportsTab();
      await reportsPage.selectPeriod('all');
    });

    test('should restrict totals and logs to two selected projects and restore all with the All chip', async ({
      reportsPage,
    }) => {
      await expect(reportsPage.projectFilterAllBtn).toHaveAttribute('aria-pressed', 'true');
      await expect(reportsPage.periodTotalStat).toContainText('06:00:00');

      await reportsPage.toggleProjectFilter('proj-scope-a');
      await reportsPage.toggleProjectFilter('proj-scope-b');

      await expect(reportsPage.projectFilterChip('proj-scope-a')).toHaveAttribute('aria-pressed', 'true');
      await expect(reportsPage.projectFilterChip('proj-scope-b')).toHaveAttribute('aria-pressed', 'true');
      await expect(reportsPage.projectFilterChip('proj-scope-c')).toHaveAttribute('aria-pressed', 'false');
      await expect(reportsPage.projectFilterAllBtn).toHaveAttribute('aria-pressed', 'false');
      await expect(reportsPage.periodTotalStat).toContainText('03:00:00');
      await expect(reportsPage.logListScrollContainer).toContainText('Scope Task A');
      await expect(reportsPage.logListScrollContainer).toContainText('Scope Task B');
      await expect(reportsPage.logListScrollContainer).not.toContainText('Scope Task C');

      await reportsPage.clearProjectFilter();

      await expect(reportsPage.projectFilterAllBtn).toHaveAttribute('aria-pressed', 'true');
      await expect(reportsPage.projectFilterChip('proj-scope-a')).toHaveAttribute('aria-pressed', 'false');
      await expect(reportsPage.periodTotalStat).toContainText('06:00:00');
      await expect(reportsPage.logListScrollContainer).toContainText('Scope Task C');
    });
  });
});

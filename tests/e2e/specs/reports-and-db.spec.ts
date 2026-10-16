import { test, expect } from '../fixtures/test-fixtures';
import { createMockProject, createMockTask, createMockTimeLog } from '../utils/state-seeder';

test.describe('Reports and Database Explorer Navigation (E2E)', () => {
  test.beforeEach(async ({ reportsPage }) => {
    await reportsPage.resetStorage();
  });

  test('should navigate to reports tab and switch analytical period filters and sort options', async ({ reportsPage }) => {
    const mockProject = createMockProject({
      id: 'proj-301',
      name: 'Analytics Project',
      color: 'violet',
      createdAt: '2026-07-12T12:00:00Z',
      archived: false,
    });

    const mockTask = createMockTask({
      id: 'task-401',
      projectId: 'proj-301',
      name: 'Analytics Task',
      createdAt: '2026-07-12T12:00:00Z',
      completed: false,
      status: 'Todo',
    });

    const mockLog = createMockTimeLog({
      id: 'log-501',
      taskId: 'task-401',
      projectId: 'proj-301',
      startTime: '2026-07-12T10:00:00Z',
      endTime: '2026-07-12T11:30:00Z',
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

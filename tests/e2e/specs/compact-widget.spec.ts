import { test, expect } from '../fixtures/test-fixtures';

test.describe('Compact Widget Layout Workflows (E2E)', () => {
  const mockProject = {
    id: 'proj-compact-101',
    name: 'Compact Mode Project',
    color: 'orange',
    createdAt: '2026-07-12T12:00:00Z',
    archived: false,
    description: 'Compact testing project',
    icon: '⚡',
    tags: ['compact', 'e2e'],
  };

  const mockTask = {
    id: 'task-compact-201',
    projectId: 'proj-compact-101',
    parentTaskId: undefined,
    name: 'Compact Task Alpha',
    createdAt: '2026-07-12T12:00:00Z',
    completed: false,
    status: 'Todo' as const,
  };

  test.beforeEach(async ({ mainPage }) => {
    await mainPage.resetStorage();
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
    await expect(compactPage.page.locator('span', { hasText: 'Compact Task Alpha' })).toBeVisible();

    // Collapse tasks list
    await compactPage.toggleTaskList();
    await expect(compactPage.taskListContainer).toBeHidden();

    // Expand tasks list again
    await compactPage.toggleTaskList();
    await expect(compactPage.taskListContainer).toBeVisible();
    await expect(compactPage.page.locator('span', { hasText: 'Compact Task Alpha' })).toBeVisible();
  });

  test('should start and stop timer directly from compact mode task card', async ({ mainPage, compactPage }) => {
    await mainPage.switchLayoutVariant('compact');

    // Verify task is visible in expanded compact drawer
    const taskCard = compactPage.page.locator('[data-testid="compact-task-card-task-compact-201"]');
    await expect(taskCard).toBeVisible();
    await expect(taskCard).toContainText('Compact Task Alpha');

    const timerBtn = compactPage.page.locator('[data-testid="compact-timer-btn-task-compact-201"]');
    await expect(timerBtn).toBeVisible();

    // Start timer on task in compact mode
    await compactPage.startTaskTimer('task-compact-201');

    // Timer button should indicate stop state (has title/aria-label stop or rose color/svg)
    await expect(timerBtn).toHaveAttribute('aria-label', /Zatrzymaj|Stop/i);

    // Stop timer
    await compactPage.stopTaskTimer('task-compact-201');

    // Timer button should indicate start state (has title/aria-label start or emerald color/svg)
    await expect(timerBtn).toHaveAttribute('aria-label', /Rozpocznij|Start/i);
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

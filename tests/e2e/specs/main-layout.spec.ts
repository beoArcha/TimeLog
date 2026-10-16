import { test, expect } from '../fixtures/test-fixtures';
import { createMockProject, createMockTask } from '../utils/state-seeder';
import { TEST_IDS, TEST_NAMES, TEST_COLORS, TEST_DATES } from '../constants/test-constants';

test.describe('Main Layout and Project/Task Lifecycle (E2E)', () => {
  test.beforeEach(async ({ mainPage }) => {
    await mainPage.resetStorage();
  });

  test('should correctly render main layout elements in a clean state', async ({ mainPage, page }) => {
    await mainPage.seedStorage({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });
    await expect(mainPage.headerLogo).toBeVisible();
    await expect(mainPage.tabMain).toBeVisible();
    await expect(mainPage.tabReports).toBeVisible();
    await expect(mainPage.tabDb).toBeVisible();
    await expect(mainPage.tabOptions).toBeVisible();
    await expect(mainPage.idleTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toBeHidden();
    await expect(mainPage.projectsListContainer).toContainText('No projects');
    await expect(page.locator('#app-root-container')).toContainText('Select project');
  });

  test('should switch layout variants in the header and toggle tab visibility', async ({ mainPage }) => {
    await expect(mainPage.tabMain).toBeVisible();
    await mainPage.switchLayoutVariant('medium');
    await expect(mainPage.tabMain).toBeHidden();
    await mainPage.switchLayoutVariant('full');
    await expect(mainPage.tabMain).toBeVisible();
  });

  test('should allow a complete workflow of project and task creation', async ({ mainPage }) => {
    await mainPage.createProject(TEST_NAMES.PROJECT_ALPHA, TEST_COLORS.VIOLET);

    const projectCard = mainPage.projectsListContainer.locator('[id^="project-item-"]', { hasText: TEST_NAMES.PROJECT_ALPHA });
    await expect(projectCard).toBeVisible();
    await mainPage.selectProject(TEST_NAMES.PROJECT_ALPHA);
    await expect(mainPage.newTaskInput).toBeVisible();
    await mainPage.createTask(TEST_NAMES.TASK_ALPHA);

    const taskCard = mainPage.tasksTreeContainer.locator('[id^="root-task-card-"]', { hasText: TEST_NAMES.TASK_ALPHA });
    await expect(taskCard).toBeVisible();
  });

  test('should correctly seed initial state and control active timer banner', async ({ mainPage }) => {
    const mockProject = createMockProject({
      id: TEST_IDS.PROJECT_SEEDED,
      name: TEST_NAMES.PROJECT_SEEDED,
      color: TEST_COLORS.ORANGE,
      createdAt: TEST_DATES.STATIC_TIMESTAMP,
      archived: false,
      description: TEST_NAMES.DESCRIPTION_DEFAULT,
      icon: '🚀',
      tags: ['test', 'e2e'],
    });

    const mockTask = createMockTask({
      id: TEST_IDS.TASK_SEEDED,
      projectId: TEST_IDS.PROJECT_SEEDED,
      name: TEST_NAMES.TASK_SEEDED,
      createdAt: TEST_DATES.STATIC_TIMESTAMP,
      completed: false,
      status: 'Todo',
    });

    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    });

    await mainPage.selectProject(TEST_NAMES.PROJECT_SEEDED);
    await expect(mainPage.tasksTreeContainer.locator('[id^="root-task-card-"]')).toContainText(TEST_NAMES.TASK_SEEDED);

    await expect(mainPage.idleTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toBeHidden();

    await mainPage.startTimerForTask(TEST_IDS.TASK_SEEDED);

    await expect(mainPage.activeTimerBanner).toBeVisible();
    await expect(mainPage.idleTimerBanner).toBeHidden();
    await expect(mainPage.activeTimerBanner).toContainText(TEST_NAMES.TASK_SEEDED);
    await expect(mainPage.activeTimerDisplay).toBeVisible();

    await mainPage.stopActiveTimer();

    await expect(mainPage.idleTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toBeHidden();
  });
});

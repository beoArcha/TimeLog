import { test, expect } from '../fixtures/test-fixtures';

test.describe('Main Layout and Project/Task Lifecycle (E2E)', () => {
  test.beforeEach(async ({ mainPage }) => {
    await mainPage.resetStorage();
  });

  test('should correctly render main layout elements in a clean state', async ({ mainPage, page }) => {
    await expect(mainPage.headerLogo).toBeVisible();
    await expect(mainPage.tabMain).toBeVisible();
    await expect(mainPage.tabReports).toBeVisible();
    await expect(mainPage.tabDb).toBeVisible();
    await expect(mainPage.tabOptions).toBeVisible();
    await expect(mainPage.idleTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toBeHidden();
    await expect(mainPage.projectsListContainer).toContainText(/Brak projektów|No projects/i);
    await expect(page.locator('#app-root-container')).toContainText(/Zaznacz projekt w bocznym menu|Select project/i);
  });

  test('should switch layout variants in the header and toggle tab visibility', async ({ mainPage }) => {
    await expect(mainPage.tabMain).toBeVisible();
    await mainPage.switchLayoutVariant('medium');
    await expect(mainPage.tabMain).toBeHidden();
    await mainPage.switchLayoutVariant('full');
    await expect(mainPage.tabMain).toBeVisible();
  });

  test('should allow a complete workflow of project and task creation', async ({ mainPage }) => {
    await mainPage.createProject('Projekt Alpha E2E', 'violet');

    const projectCard = mainPage.projectsListContainer.locator('[id^="project-item-"]');
    await expect(projectCard).toContainText('Projekt Alpha E2E');
    await mainPage.selectProject('Projekt Alpha E2E');
    await expect(mainPage.newTaskInput).toBeVisible();
    await mainPage.createTask('Zadanie Główne E2E');

    const taskCard = mainPage.tasksTreeContainer.locator('[id^="root-task-card-"]');
    await expect(taskCard).toContainText('Zadanie Główne E2E');
  });

  test('should correctly seed initial state and control active timer banner', async ({ mainPage }) => {
    const mockProject = {
      id: 'proj-999',
      name: 'Projekt Seedowany E2E',
      color: 'orange',
      createdAt: '2026-07-12T12:00:00Z',
      archived: false,
      description: 'Opis projektu testowego',
      icon: '🚀',
      tags: ['test', 'e2e'],
    };

    const mockTask = {
      id: 'task-888',
      projectId: 'proj-999',
      parentTaskId: undefined,
      name: 'Zadanie Seedowane E2E',
      createdAt: '2026-07-12T12:00:00Z',
      completed: false,
      status: 'Todo' as const,
    };

    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    });

    await mainPage.selectProject('Projekt Seedowany E2E');
    await expect(mainPage.tasksTreeContainer.locator('[id^="root-task-card-"]')).toContainText('Zadanie Seedowane E2E');

    await expect(mainPage.idleTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toBeHidden();

    await mainPage.startTimerForTask('task-888');

    await expect(mainPage.activeTimerBanner).toBeVisible();
    await expect(mainPage.idleTimerBanner).toBeHidden();
    await expect(mainPage.activeTimerBanner).toContainText('Zadanie Seedowane E2E');
    await expect(mainPage.activeTimerDisplay).toBeVisible();

    await mainPage.stopActiveTimer();

    await expect(mainPage.idleTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toBeHidden();
  });
});

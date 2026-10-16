import { test, expect } from '../fixtures/test-fixtures';
import { createMockProject, createMockTask } from '../utils/state-seeder';
import { TEST_IDS, TEST_NAMES, TEST_COLORS, TEST_DATES } from '../constants/test-constants';

test.describe('Task and Subtask Management Workflows (E2E)', () => {
  test('should allow completing a root task and verifying status updates', async ({ mainPage }) => {
    const mockProject = createMockProject({
      id: TEST_IDS.PROJECT_COMPLETION,
      name: TEST_NAMES.PROJECT_COMPLETION,
      color: TEST_COLORS.EMERALD,
      createdAt: TEST_DATES.STATIC_TIMESTAMP,
      archived: false,
    });

    const mockTask = createMockTask({
      id: TEST_IDS.TASK_COMPLETION,
      projectId: TEST_IDS.PROJECT_COMPLETION,
      name: TEST_NAMES.TASK_COMPLETION,
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

    await mainPage.selectProject(TEST_NAMES.PROJECT_COMPLETION);
    const taskCard = mainPage.page.locator(`#root-task-card-${TEST_IDS.TASK_COMPLETION}`);
    await expect(taskCard).toBeVisible();

    await mainPage.toggleTaskComplete(TEST_IDS.TASK_COMPLETION);
    await expect(mainPage.page.locator(`#check-task-${TEST_IDS.TASK_COMPLETION}`)).toHaveAttribute('aria-checked', 'true');
  });

  test('should create a subtask under a parent task and verify subtask item visibility', async ({ mainPage }) => {
    const mockProject = createMockProject({
      id: TEST_IDS.PROJECT_SUBTASKS,
      name: TEST_NAMES.PROJECT_SUBTASKS,
      color: TEST_COLORS.BLUE,
      createdAt: TEST_DATES.STATIC_TIMESTAMP,
      archived: false,
    });

    const mockParentTask = createMockTask({
      id: TEST_IDS.TASK_PARENT,
      projectId: TEST_IDS.PROJECT_SUBTASKS,
      name: TEST_NAMES.TASK_PARENT,
      createdAt: TEST_DATES.STATIC_TIMESTAMP,
      completed: false,
      status: 'Todo',
    });

    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockParentTask],
      logs: [],
      activeLog: null,
    });

    await mainPage.selectProject(TEST_NAMES.PROJECT_SUBTASKS);
    await mainPage.createSubtask(TEST_IDS.TASK_PARENT, TEST_NAMES.TASK_SUBTASK);

    const subtaskLocator = mainPage.page.locator('[id^="subtask-item-"]');
    await expect(subtaskLocator).toBeVisible();
    await expect(subtaskLocator).toContainText(TEST_NAMES.TASK_SUBTASK);
  });

  test('should delete a task and remove it from the tasks tree container', async ({ mainPage }) => {
    const mockProject = createMockProject({
      id: TEST_IDS.PROJECT_DELETION,
      name: TEST_NAMES.PROJECT_DELETION,
      color: TEST_COLORS.ROSE,
      createdAt: TEST_DATES.STATIC_TIMESTAMP,
      archived: false,
    });

    const mockTask = createMockTask({
      id: TEST_IDS.TASK_DELETION,
      projectId: TEST_IDS.PROJECT_DELETION,
      name: TEST_NAMES.TASK_DELETION,
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

    await mainPage.selectProject(TEST_NAMES.PROJECT_DELETION);
    const taskCard = mainPage.page.locator(`#root-task-card-${TEST_IDS.TASK_DELETION}`);
    await expect(taskCard).toBeVisible();

    await mainPage.deleteTask(TEST_IDS.TASK_DELETION);
    await expect(taskCard).toBeHidden();
  });

  test('should archive and unarchive a project directly from the sidebar', async ({ mainPage }) => {
    const mockProject = createMockProject({
      id: TEST_IDS.PROJECT_ARCHIVE,
      name: TEST_NAMES.PROJECT_ARCHIVE,
      color: TEST_COLORS.AMBER,
      createdAt: TEST_DATES.STATIC_TIMESTAMP,
      archived: false,
    });

    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    const projectItem = mainPage.page.locator(`#project-item-${TEST_IDS.PROJECT_ARCHIVE}`);
    await expect(projectItem).toBeVisible();
    await expect(projectItem).toHaveAttribute('data-archived', 'false');

    await mainPage.toggleProjectArchive(TEST_IDS.PROJECT_ARCHIVE);
    await expect(projectItem).toHaveAttribute('data-archived', 'true');

    await mainPage.toggleProjectArchive(TEST_IDS.PROJECT_ARCHIVE);
    await expect(projectItem).toHaveAttribute('data-archived', 'false');
  });
});

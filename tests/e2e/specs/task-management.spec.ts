import { test, expect } from '../fixtures/test-fixtures';

test.describe('Task and Subtask Management Workflows (E2E)', () => {
  test.beforeEach(async ({ mainPage }) => {
    await mainPage.resetStorage();
  });

  test('should allow completing a root task and verifying status updates', async ({ mainPage }) => {
    const mockProject = {
      id: 'proj-101',
      name: 'Project For Completion',
      color: 'emerald',
      createdAt: '2026-07-12T12:00:00Z',
      archived: false,
    };

    const mockTask = {
      id: 'task-201',
      projectId: 'proj-101',
      parentTaskId: undefined,
      name: 'Task To Complete',
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

    await mainPage.selectProject('Project For Completion');
    const taskCard = mainPage.page.locator('#root-task-card-task-201');
    await expect(taskCard).toBeVisible();

    await mainPage.toggleTaskComplete('task-201');
    await expect(mainPage.page.locator('#check-task-task-201')).toBeChecked();
  });

  test('should create a subtask under a parent task and verify subtask item visibility', async ({ mainPage }) => {
    const mockProject = {
      id: 'proj-102',
      name: 'Project With Subtasks',
      color: 'blue',
      createdAt: '2026-07-12T12:00:00Z',
      archived: false,
    };

    const mockParentTask = {
      id: 'task-202',
      projectId: 'proj-102',
      parentTaskId: undefined,
      name: 'Parent Task E2E',
      createdAt: '2026-07-12T12:00:00Z',
      completed: false,
      status: 'Todo' as const,
    };

    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockParentTask],
      logs: [],
      activeLog: null,
    });

    await mainPage.selectProject('Project With Subtasks');
    await mainPage.createSubtask('task-202', 'Subtask Alpha E2E');

    const subtaskLocator = mainPage.page.locator('[id^="subtask-item-"]');
    await expect(subtaskLocator).toBeVisible();
    await expect(subtaskLocator).toContainText('Subtask Alpha E2E');
  });

  test('should delete a task and remove it from the tasks tree container', async ({ mainPage }) => {
    const mockProject = {
      id: 'proj-103',
      name: 'Project For Deletion',
      color: 'rose',
      createdAt: '2026-07-12T12:00:00Z',
      archived: false,
    };

    const mockTask = {
      id: 'task-203',
      projectId: 'proj-103',
      parentTaskId: undefined,
      name: 'Task To Delete',
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

    await mainPage.selectProject('Project For Deletion');
    const taskCard = mainPage.page.locator('#root-task-card-task-203');
    await expect(taskCard).toBeVisible();

    await mainPage.deleteTask('task-203');
    await expect(taskCard).toBeHidden();
  });

  test('should archive and unarchive a project directly from the sidebar', async ({ mainPage }) => {
    const mockProject = {
      id: 'proj-104',
      name: 'Project To Archive',
      color: 'amber',
      createdAt: '2026-07-12T12:00:00Z',
      archived: false,
    };

    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    const projectItem = mainPage.page.locator('#project-item-proj-104');
    await expect(projectItem).toBeVisible();
    await expect(projectItem).not.toHaveClass(/opacity-50/);

    await mainPage.toggleProjectArchive('proj-104');
    await expect(projectItem).toHaveClass(/opacity-50/);

    await mainPage.toggleProjectArchive('proj-104');
    await expect(projectItem).not.toHaveClass(/opacity-50/);
  });
});

import { test, expect } from '../fixtures/test-fixtures';
import { createMockProject, createMockTask } from '../utils/state-seeder';
import { TEST_IDS, TEST_NAMES } from '../constants/test-constants';

test.describe('CLI Drawer Global Workflows (E2E)', () => {
  test.beforeEach(async ({ mainPage }) => {
    await mainPage.resetStorage();
  });

  test('should open drawer via shortcut, execute help command, and dismiss via Escape', async ({
    mainPage,
    cliDrawerPage,
  }) => {
    await mainPage.seedStorage({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    await expect(cliDrawerPage.drawerContainer).toBeHidden();

    // Open via shortcut
    await cliDrawerPage.openDrawerViaShortcut();
    await expect(cliDrawerPage.drawerContainer).toBeVisible();
    await expect(cliDrawerPage.cliInput).toBeFocused();

    // Execute help
    await cliDrawerPage.runCommand('help');
    await cliDrawerPage.expectHelpListing();

    // Dismiss via Escape
    await cliDrawerPage.closeDrawerViaEsc();
    await expect(cliDrawerPage.drawerContainer).toBeHidden();
  });

  test('should start timer from CLI drawer and reflect in main application banner', async ({
    mainPage,
    cliDrawerPage,
  }) => {
    const mockProject = createMockProject({
      id: TEST_IDS.PROJECT_ALPHA,
      name: TEST_NAMES.PROJECT_ALPHA,
    });
    const mockTask = createMockTask({
      id: TEST_IDS.TASK_ALPHA,
      projectId: TEST_IDS.PROJECT_ALPHA,
      name: TEST_NAMES.TASK_ALPHA,
    });

    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    });

    await expect(mainPage.idleTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toBeHidden();

    // Open drawer and start timer
    await cliDrawerPage.openDrawerViaShortcut();
    await expect(cliDrawerPage.drawerContainer).toBeVisible();

    await cliDrawerPage.runCommand(`start ${TEST_IDS.TASK_ALPHA}`);
    await cliDrawerPage.expectStartedOutput(TEST_NAMES.TASK_ALPHA);

    // Verify main app timer banner is active
    await expect(mainPage.activeTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toContainText(TEST_NAMES.TASK_ALPHA);
    await expect(mainPage.idleTimerBanner).toBeHidden();
  });

  test('should atomically switch tasks via switch command', async ({
    mainPage,
    cliDrawerPage,
  }) => {
    const mockProject = createMockProject({
      id: TEST_IDS.PROJECT_ALPHA,
      name: TEST_NAMES.PROJECT_ALPHA,
    });
    const task1 = createMockTask({
      id: TEST_IDS.TASK_ALPHA,
      projectId: TEST_IDS.PROJECT_ALPHA,
      name: TEST_NAMES.TASK_ALPHA,
    });
    const task2 = createMockTask({
      id: TEST_IDS.TASK_SEEDED,
      projectId: TEST_IDS.PROJECT_ALPHA,
      name: TEST_NAMES.TASK_SEEDED,
    });

    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [task1, task2],
      logs: [],
      activeLog: null,
    });

    // Start first task
    await cliDrawerPage.openDrawerViaShortcut();
    await cliDrawerPage.runCommand(`start ${TEST_IDS.TASK_ALPHA}`);
    await expect(mainPage.activeTimerBanner).toContainText(TEST_NAMES.TASK_ALPHA);

    // Atomically switch to task2
    await cliDrawerPage.runCommand(`switch ${task2.id}`);
    await cliDrawerPage.expectSwitchedOutput(task2.name);

    // Verify timer banner reflects switched task
    await expect(mainPage.activeTimerBanner).toContainText(task2.name);
  });

  test('should toggle sandbox emulator mode and update mode badge indicator', async ({
    mainPage,
    cliDrawerPage,
  }) => {
    await mainPage.seedStorage({
      projects: [],
      tasks: [],
      logs: [],
      activeLog: null,
    });

    await cliDrawerPage.openDrawerViaShortcut();
    await expect(cliDrawerPage.drawerContainer).toBeVisible();

    const liveBadgeText = await cliDrawerPage.readModeBadgeText();

    await cliDrawerPage.runCommand('sandbox on');
    await cliDrawerPage.expectModeBadgeChangedFrom(liveBadgeText);

    await cliDrawerPage.runCommand('sandbox off');
    await cliDrawerPage.expectModeBadgeEquals(liveBadgeText);
  });
});

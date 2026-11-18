import { test, expect } from '../fixtures/test-fixtures';
import { createMockProject, createMockTask } from '../utils/state-seeder';
import { TEST_IDS, TEST_NAMES } from '../constants/test-constants';

test.describe('CLI Terminal Workflow Journey (E2E)', () => {
  test.beforeEach(async ({ mainPage }) => {
    await mainPage.resetStorage();
  });

  test('should execute comprehensive CLI terminal workflow journey from drawer shortcut to task switching and sandbox', async ({
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

    // 1. Initial State: drawer hidden, idle timer banner displayed
    await expect(cliDrawerPage.drawerContainer).toBeHidden();
    await expect(mainPage.idleTimerBanner).toBeVisible();

    // 2. Open CLI drawer via global keyboard shortcut
    await cliDrawerPage.openDrawerViaShortcut();
    await expect(cliDrawerPage.drawerContainer).toBeVisible();
    await expect(cliDrawerPage.cliInput).toBeFocused();

    // 3. Execute help command and verify command listings
    await cliDrawerPage.runCommand('help');
    await cliDrawerPage.expectHelpListing();

    // 4. Start timer on task 1 and verify reflection in main UI
    await cliDrawerPage.runCommand(`start ${TEST_IDS.TASK_ALPHA}`);
    await cliDrawerPage.expectStartedOutput(TEST_NAMES.TASK_ALPHA);
    await expect(mainPage.activeTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toContainText(TEST_NAMES.TASK_ALPHA);

    // 5. Execute status command and verify it reports the running task
    await cliDrawerPage.runCommand('status');
    await cliDrawerPage.expectStatusOutput(TEST_IDS.TASK_ALPHA);

    // 6. Atomically switch to task 2 via CLI switch command
    await cliDrawerPage.runCommand(`switch ${task2.id}`);
    await cliDrawerPage.expectSwitchedOutput(task2.name);
    await expect(mainPage.activeTimerBanner).toContainText(task2.name);

    // 7. Stop active timer via CLI stop command
    await cliDrawerPage.runCommand('stop');
    await cliDrawerPage.expectStoppedOutput(task2.name);
    await expect(mainPage.idleTimerBanner).toBeVisible();

    // 8. Toggle sandbox emulator mode
    const liveBadgeText = await cliDrawerPage.readModeBadgeText();

    await cliDrawerPage.runCommand('sandbox on');
    await cliDrawerPage.expectModeBadgeChangedFrom(liveBadgeText);

    await cliDrawerPage.runCommand('sandbox off');
    await cliDrawerPage.expectModeBadgeEquals(liveBadgeText);

    // 9. Close drawer via close button and verify hidden
    await cliDrawerPage.closeDrawerViaBtn();
    await expect(cliDrawerPage.drawerContainer).toBeHidden();
  });
});

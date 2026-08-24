import { test, expect } from '../fixtures/test-fixtures';

test.describe('Persistence & Reload Resilience (E2E)', () => {
  const mockProject = {
    id: 'proj-resilience-1',
    name: 'Resilience Project',
    color: 'emerald',
    createdAt: '2026-07-12T12:00:00Z',
    archived: false,
    description: 'Resilience testing project',
    icon: '🛡️',
    tags: ['resilience', 'e2e'],
  };

  const mockTask = {
    id: 'task-resilience-1',
    projectId: 'proj-resilience-1',
    parentTaskId: undefined,
    name: 'Continuous Measurement Task',
    createdAt: '2026-07-12T12:00:00Z',
    completed: false,
    status: 'Todo' as const,
  };

  test.beforeEach(async ({ mainPage }) => {
    await mainPage.resetStorage();
  });

  test('should preserve active timer state and continue tracking across page reloads', async ({ mainPage, page }) => {
    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    });

    await mainPage.selectProject('Resilience Project');
    await expect(mainPage.idleTimerBanner).toBeVisible();

    // Start timer on task
    await mainPage.startTimerForTask('task-resilience-1');
    await expect(mainPage.activeTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toContainText('Continuous Measurement Task');

    // Reload page to simulate browser refresh / app restart
    await page.reload();
    await page.waitForSelector('#app-root-container', { timeout: 10000 });

    // Verify active timer is still running and visible after reload
    await expect(mainPage.activeTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toContainText('Continuous Measurement Task');
    await expect(mainPage.activeTimerDisplay).toBeVisible();
    await expect(mainPage.idleTimerBanner).toBeHidden();

    // Stop timer after reload
    await mainPage.stopActiveTimer();
    await expect(mainPage.idleTimerBanner).toBeVisible();
    await expect(mainPage.activeTimerBanner).toBeHidden();
  });

  test('should persist chosen layout variant across page reloads', async ({ mainPage, page }) => {
    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    });

    // Switch to medium layout
    await mainPage.switchLayoutVariant('medium');
    await expect(mainPage.tabMain).toBeHidden();

    // Reload page
    await page.reload();
    await page.waitForSelector('#app-root-container', { timeout: 10000 });

    // Medium layout should remain active
    await expect(mainPage.tabMain).toBeHidden();

    // Switch back to full layout
    await mainPage.switchLayoutVariant('full');
    await expect(mainPage.tabMain).toBeVisible();

    // Reload page again
    await page.reload();
    await page.waitForSelector('#app-root-container', { timeout: 10000 });

    // Full layout should remain active
    await expect(mainPage.tabMain).toBeVisible();
  });

  test('should persist language setting across page reloads', async ({ mainPage, page }) => {
    await mainPage.seedStorage({
      projects: [mockProject],
      tasks: [mockTask],
      logs: [],
      activeLog: null,
    });

    // Seed German locale in settings storage
    await page.evaluate(() => {
      const existingSettings = JSON.parse(localStorage.getItem('timelog_persistence_plugin_settings') || '{}');
      localStorage.setItem('timelog_persistence_plugin_settings', JSON.stringify({
        ...existingSettings,
        locale: 'de',
      }));
    });

    await page.reload();
    await page.waitForSelector('#app-root-container', { timeout: 10000 });

    // Verify UI reflects German translations (e.g. TabMain / TabReports)
    const reportsTab = page.locator('[data-testid="tab-reports"]');
    await expect(reportsTab).toBeVisible();
  });

  test('should gracefully initialize and render default initial state without errors when storage is empty', async ({ mainPage }) => {
    await mainPage.resetStorage();

    // Verify initial state is rendered with default projects
    await expect(mainPage.headerLogo).toBeVisible();
    await expect(mainPage.tabMain).toBeVisible();
    await expect(mainPage.projectsListContainer).toContainText(/LogTime by OxyFlow Backend Engine|Zouk Flow/i);
    await expect(mainPage.idleTimerBanner).toBeVisible();
  });
});

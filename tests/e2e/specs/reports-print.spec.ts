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

test.describe('Reports Print & Multi-page PDF E2E Suite', () => {
  const ONE_HOUR_MS = 3600 * 1000;

  test('should render print header, keep collapsed sections visible, and generate multi-page PDF', async ({
    reportsPage,
    page,
  }) => {
    // 1. Arrange: Seed 45 logs across 15 days to ensure the printed report spans multiple pages
    const baseTimestamp = new Date('2026-06-15T12:00:00Z').getTime();
    const entryCount = 45;

    const mockTasks = Array.from({ length: 5 }, (_, idx) =>
      createMockTask({
        id: `print-task-${idx}`,
        projectId: TEST_IDS.PROJECT_ANALYTICS,
        name: `Analytics Task ${idx + 1}`,
      })
    );

    const mockLogs = Array.from({ length: entryCount }, (_, idx) => {
      // Space entries out across multiple days and times
      const dayOffset = Math.floor(idx / 3);
      const hourOffset = (idx % 3) * 2;
      const startMs = baseTimestamp - dayOffset * 24 * ONE_HOUR_MS + hourOffset * ONE_HOUR_MS;
      const endMs = startMs + ONE_HOUR_MS;

      return createMockTimeLog({
        id: `print-log-${idx}`,
        taskId: `print-task-${idx % 5}`,
        projectId: TEST_IDS.PROJECT_ANALYTICS,
        startTime: new Date(startMs).toISOString(),
        endTime: new Date(endMs).toISOString(),
        note: `Detailed audit entry description for print run item ${idx + 1}`,
      });
    });

    const initialState = createDefaultState({
      projects: [
        createMockProject({
          id: TEST_IDS.PROJECT_ANALYTICS,
          name: TEST_NAMES.PROJECT_ANALYTICS,
          color: TEST_COLORS.ORANGE,
        }),
      ],
      tasks: mockTasks,
      logs: mockLogs,
    });

    await reportsPage.seedStorage(initialState);
    await page.reload();
    await reportsPage.openReportsTab();
    await reportsPage.selectPeriod('all');

    await expect(reportsPage.reportsPanel).toBeVisible();

    // 2. Collapse a card (Stacked Bar Activity Chart) on screen
    const activityChartHeader = page.locator('[data-testid="stacked-activity-chart-header"]');
    await expect(activityChartHeader).toBeVisible();
    await activityChartHeader.click();

    // Verify that the chart content wrapper is collapsed on screen
    const chartContentWrapper = page.locator('#collapsible-content-stacked-activity-chart-header');
    await expect(chartContentWrapper).toHaveClass(/hidden/);

    // 3. Emulate print media
    await page.emulateMedia({ media: 'print' });

    // Period header must be visible in print mode
    const periodHeader = page.locator('[data-testid="report-print-period-header"]');
    await expect(periodHeader).toBeVisible();
    await expect(periodHeader).toContainText(/All Time|All/i);

    // Collapsed card must be forced visible in print mode via forceMountOnPrint (print:flex)
    await expect(chartContentWrapper).toBeVisible();

    // Print datetime stamps must be visible in print mode with calendar date and UTC time
    const printDates = page.locator('[data-testid="log-entry-print-datetime"]');
    await expect(printDates.first()).toBeVisible();
    const firstPrintDateText = await printDates.first().textContent();
    expect(firstPrintDateText).toMatch(/\[\d{2}\/\d{2}\/\d{4}/);

    // Interactive controls must be hidden in print mode
    const periodSelector = page.locator('[data-testid="report-period-selector"]');
    await expect(periodSelector).not.toBeVisible();

    const printButton = page.locator('[data-testid="report-print-button"]');
    await expect(printButton).not.toBeVisible();

    // Verify unclipped log container
    const scrollContainer = page.locator('[data-testid="report-log-list-scroll-container"]');
    await expect(scrollContainer).toBeVisible();
    const isUnclipped = await scrollContainer.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.overflowY === 'visible' && style.maxHeight === 'none';
    });
    expect(isUnclipped).toBe(true);

    // 4. Generate actual PDF and verify multi-page pagination
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1.5cm',
        bottom: '1.5cm',
        left: '1.5cm',
        right: '1.5cm',
      },
    });

    expect(pdfBuffer).toBeDefined();
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    const pdfText = pdfBuffer.toString('latin1');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).not.toBeNull();
    const pageCount = pageMatches ? pageMatches.length : 0;
    // With 45 log entries, chart, breakdown, stats, and headers, the PDF must span at least 2 pages
    expect(pageCount).toBeGreaterThanOrEqual(2);

    // 5. Restore screen media
    await page.emulateMedia({ media: null });
  });
});

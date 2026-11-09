import { test, expect } from '../fixtures/test-fixtures';

const VIEWPORTS = [
  { width: 1440, height: 900, expectedFrameMaxWidth: 1280, label: '1440x900 (below 2xl)' },
  { width: 1920, height: 1080, expectedFrameMaxWidth: 1600, label: '1920x1080 (at/above 2xl)' },
  { width: 2560, height: 1440, expectedFrameMaxWidth: 1600, label: '2560x1440 (ultrawide 2xl)' },
];

test.describe('Windowed Frame Geometry and Content Alignment in Full Mode (E2E)', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`Viewport ${vp.label}`, () => {
      test.use({
        viewport: { width: vp.width, height: vp.height },
      });

      test('verifies frame width, centering, content alignment, tab bar scroll and zero horizontal overflow', async ({
        page,
        mainPage,
      }) => {
        await mainPage.resetStorage();
        await mainPage.seedStorage({
          projects: [],
          tasks: [],
          logs: [],
          activeLog: null,
        });

        // Ensure elements are mounted and visible
        await expect(mainPage.windowedFrame).toBeVisible();
        await expect(mainPage.layoutHeader).toBeVisible();
        await expect(mainPage.tabBarScroll).toBeVisible();
        await expect(mainPage.layoutMain).toBeVisible();
        await expect(mainPage.layoutFooter).toBeVisible();

        // Wait for scale and entrance transition to settle at expected width
        await mainPage.waitForLayoutStability(vp.expectedFrameMaxWidth);

        // 1. Verify outer frame expected width (1280px below 2xl, 1600px at/above 2xl)
        const frameMetrics = await mainPage.windowedFrame.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          return {
            width: rect.width,
            left: rect.left,
            right: rect.right,
            maxWidth: style.maxWidth,
          };
        });

        expect(Math.round(frameMetrics.width)).toBe(vp.expectedFrameMaxWidth);

        // 2. Verify outer frame is horizontally centered (mx-auto)
        const expectedMargin = (vp.width - frameMetrics.width) / 2;
        expect(Math.abs(frameMetrics.left - expectedMargin)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(vp.width - frameMetrics.right - expectedMargin)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(frameMetrics.left - (vp.width - frameMetrics.right))).toBeLessThanOrEqual(1.5);

        // 3. Verify Header, TabBar, Main, and Footer have consistent content box left and right boundaries
        const headerMetrics = await mainPage.getElementContentMetrics(mainPage.layoutHeader);
        const tabBarMetrics = await mainPage.getElementContentMetrics(mainPage.tabBarScroll);
        const mainMetrics = await mainPage.getElementContentMetrics(mainPage.layoutMain);
        const footerMetrics = await mainPage.getElementContentMetrics(mainPage.layoutFooter);

        // Standard padding at >= 1024px is px-8 (32px)
        expect(headerMetrics.paddingLeft).toBe(32);
        expect(headerMetrics.paddingRight).toBe(32);
        expect(tabBarMetrics.paddingLeft).toBe(32);
        expect(tabBarMetrics.paddingRight).toBe(32);
        expect(mainMetrics.paddingLeft).toBe(32);
        expect(mainMetrics.paddingRight).toBe(32);
        expect(footerMetrics.paddingLeft).toBe(32);
        expect(footerMetrics.paddingRight).toBe(32);

        // Content left alignment comparison
        expect(Math.abs(headerMetrics.contentLeft - tabBarMetrics.contentLeft)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(headerMetrics.contentLeft - mainMetrics.contentLeft)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(headerMetrics.contentLeft - footerMetrics.contentLeft)).toBeLessThanOrEqual(1.5);

        // Content right alignment comparison
        expect(Math.abs(headerMetrics.contentRight - tabBarMetrics.contentRight)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(headerMetrics.contentRight - mainMetrics.contentRight)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(headerMetrics.contentRight - footerMetrics.contentRight)).toBeLessThanOrEqual(1.5);

        // Content width comparison
        expect(Math.abs(headerMetrics.contentWidth - tabBarMetrics.contentWidth)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(headerMetrics.contentWidth - mainMetrics.contentWidth)).toBeLessThanOrEqual(1.5);
        expect(Math.abs(headerMetrics.contentWidth - footerMetrics.contentWidth)).toBeLessThanOrEqual(1.5);

        // 4. Verify TabBar preserves horizontal scroll behavior and does not expand the frame
        const tabBarScrollState = await mainPage.tabBarScroll.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return {
            overflowX: style.overflowX,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
          };
        });

        expect(['auto', 'scroll']).toContain(tabBarScrollState.overflowX);

        const tabBarContainerWidth = await mainPage.tabBarContainer.evaluate(
          (el) => el.getBoundingClientRect().width
        );
        expect(Math.round(tabBarContainerWidth)).toBeLessThanOrEqual(vp.expectedFrameMaxWidth);

        // 5. Verify no horizontal overflow in root / document
        const overflowState = await page.evaluate(() => ({
          docScrollWidth: document.documentElement.scrollWidth,
          docClientWidth: document.documentElement.clientWidth,
          bodyScrollWidth: document.body.scrollWidth,
          windowInnerWidth: window.innerWidth,
          scrollX: window.scrollX,
        }));

        expect(overflowState.docScrollWidth).toBeLessThanOrEqual(overflowState.docClientWidth);
        expect(overflowState.bodyScrollWidth).toBeLessThanOrEqual(overflowState.windowInnerWidth);
        expect(overflowState.scrollX).toBe(0);
      });
    });
  }
});

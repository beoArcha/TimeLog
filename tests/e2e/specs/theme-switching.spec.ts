import { test, expect } from '../fixtures/test-fixtures';
import { TEST_THEMES } from '../constants/test-constants';

test.describe('Theme Switching and CSS Token Integrity (E2E)', () => {
  test.beforeEach(async ({ mainPage }) => {
    await mainPage.resetStorage();
  });

  test('should switch theme to light, dark, and high-contrast via header theme selector', async ({ page }) => {
    const lightBtn = page.locator(`[data-testid="theme-btn-${TEST_THEMES.LIGHT}"]`);
    const darkBtn = page.locator(`[data-testid="theme-btn-${TEST_THEMES.DARK}"]`);
    const highContrastBtn = page.locator(`[data-testid="theme-btn-${TEST_THEMES.HIGH_CONTRAST}"]`);

    await expect(lightBtn).toBeVisible();
    await expect(darkBtn).toBeVisible();
    await expect(highContrastBtn).toBeVisible();

    // Switch to Light Theme
    await lightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', TEST_THEMES.LIGHT);

    // Switch to Dark Theme
    await darkBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', TEST_THEMES.DARK);

    // Switch to High Contrast Theme
    await highContrastBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', TEST_THEMES.HIGH_CONTRAST);
  });

  test('should persist chosen theme across page reloads', async ({ page }) => {
    const highContrastBtn = page.locator(`[data-testid="theme-btn-${TEST_THEMES.HIGH_CONTRAST}"]`);
    await highContrastBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', TEST_THEMES.HIGH_CONTRAST);

    // Reload page to verify persistence
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app-root-container', { timeout: 15000 });

    await expect(page.locator('html')).toHaveAttribute('data-theme', TEST_THEMES.HIGH_CONTRAST);

    // Switch back to light theme and verify persistence
    const lightBtn = page.locator(`[data-testid="theme-btn-${TEST_THEMES.LIGHT}"]`);
    await lightBtn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', TEST_THEMES.LIGHT);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app-root-container', { timeout: 15000 });

    await expect(page.locator('html')).toHaveAttribute('data-theme', TEST_THEMES.LIGHT);
  });
});

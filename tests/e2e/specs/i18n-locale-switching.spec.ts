import { test, expect } from '../fixtures/test-fixtures';
import { TEST_LOCALES, LOCALE_REPORTS_LABELS } from '../constants/test-constants';

test.describe('Internationalization (i18n) Locale Switching (E2E)', () => {
  test.beforeEach(async ({ mainPage }) => {
    await mainPage.resetStorage();
  });

  test('should switch across all 6 supported locales via header language buttons and update navigation labels', async ({ page }) => {
    const reportsTab = page.locator('[data-testid="tab-reports"]');
    await expect(reportsTab).toBeVisible();

    const locales = [
      TEST_LOCALES.PL,
      TEST_LOCALES.DE,
      TEST_LOCALES.ES,
      TEST_LOCALES.FR,
      TEST_LOCALES.PT_BR,
      TEST_LOCALES.EN,
    ] as const;

    for (const locale of locales) {
      const langBtn = page.locator(`[data-testid="lang-btn-${locale}"]`);
      await expect(langBtn).toBeVisible();
      await langBtn.click();

      // Verify that navigation label updates reactively according to dictionary
      await expect(reportsTab).toContainText(LOCALE_REPORTS_LABELS[locale]);
    }
  });

  test('should persist selected locale preference across page reloads', async ({ page }) => {
    const reportsTab = page.locator('[data-testid="tab-reports"]');

    // Switch to French
    const frBtn = page.locator(`[data-testid="lang-btn-${TEST_LOCALES.FR}"]`);
    await frBtn.click();
    await expect(reportsTab).toContainText(LOCALE_REPORTS_LABELS.fr);

    // Reload page to verify persistence
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app-root-container', { timeout: 15000 });

    await expect(reportsTab).toContainText(LOCALE_REPORTS_LABELS.fr);

    // Switch to Polish and verify persistence
    const plBtn = page.locator(`[data-testid="lang-btn-${TEST_LOCALES.PL}"]`);
    await plBtn.click();
    await expect(reportsTab).toContainText(LOCALE_REPORTS_LABELS.pl);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#app-root-container', { timeout: 15000 });

    await expect(reportsTab).toContainText(LOCALE_REPORTS_LABELS.pl);
  });
});

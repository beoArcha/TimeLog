import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class ReportsPage extends BasePage {
  readonly tabReportsBtn: Locator;
  readonly reportsPanel: Locator;
  readonly periodTodayBtn: Locator;
  readonly periodWeekBtn: Locator;
  readonly periodMonthBtn: Locator;
  readonly periodAllBtn: Locator;
  readonly reportSortSelect: Locator;

  constructor(page: Page) {
    super(page);
    this.tabReportsBtn = page.locator('[data-testid="tab-reports"]');
    this.reportsPanel = page.locator('#reports-panel');
    this.periodTodayBtn = page.locator('[data-testid="period-btn-today"]');
    this.periodWeekBtn = page.locator('[data-testid="period-btn-week"]');
    this.periodMonthBtn = page.locator('[data-testid="period-btn-month"]');
    this.periodAllBtn = page.locator('[data-testid="period-btn-all"]');
    this.reportSortSelect = page.locator('[data-testid="report-sort-select"]');
  }

  async openReportsTab() {
    await this.tabReportsBtn.click();
  }

  async selectPeriod(period: 'today' | 'week' | 'month' | 'all') {
    if (period === 'today') {
      await this.periodTodayBtn.click();
    } else if (period === 'week') {
      await this.periodWeekBtn.click();
    } else if (period === 'month') {
      await this.periodMonthBtn.click();
    } else if (period === 'all') {
      await this.periodAllBtn.click();
    }
  }

  async selectSortOrder(sortOrder: 'date' | 'duration') {
    await this.reportSortSelect.selectOption(sortOrder);
  }
}

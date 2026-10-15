import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

/**
 * Base Abstract Class for all Fulfillment Orders Pages
 * Encapsulates common behavior of the Quasar <order-table> component
 */
export abstract class BaseOrdersPage extends BasePage {
  readonly tableTitle: Locator;
  readonly searchInput: Locator;
  readonly tableRows: Locator;
  readonly loadingSpinner: Locator;
  readonly noDataLabel: Locator;
  readonly brandStoreFilter: Locator;

  constructor(page: Page) {
    super(page);

    this.tableTitle = page.locator('.tableTitle').first();
    this.searchInput = page.locator('input[placeholder="Search"]').first();
    this.tableRows = page.locator('.q-table tbody tr.cursor-pointer');
    this.loadingSpinner = page.locator('.q-table__loading, .q-spinner').first();
    this.noDataLabel = page.locator('.no-data, text="No record(s) found."').first();
    this.brandStoreFilter = page.locator('.select-ellipsis, label:has-text("Select Brand Store")').first();
  }

  /**
   * Waits for the table loading overlay to disappear
   */
  async expectTableLoaded(timeout: number = 30000): Promise<void> {
    await this.loadingSpinner.waitFor({ state: 'hidden', timeout }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * Verifies the table title
   */
  async expectTitle(expected: string | RegExp): Promise<void> {
    await this.expectTableLoaded();
    await expect(this.tableTitle).toHaveText(expected, { timeout: 15000 });
  }

  /**
   * Search orders by order number or customer name
   */
  async search(query: string): Promise<void> {
    await this.searchInput.waitFor({ state: 'visible', timeout: 15000 });
    await this.searchInput.fill(query);
    await this.expectTableLoaded();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Clear the search input
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.fill('');
    await this.expectTableLoaded();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Get the current count of visible rows in the table
   */
  async getRowCount(): Promise<number> {
    await this.expectTableLoaded();
    if (await this.noDataLabel.isVisible().catch(() => false)) {
      return 0;
    }
    return this.tableRows.count();
  }

  /**
   * Dismiss floating promotional or update banners
   */
  async dismissPromoBanners(): Promise<void> {
    await this.page.evaluate(() => {
      const banner = document.querySelector('#q-notify .install-app-modal');
      if (banner) banner.remove();
      const notify = document.querySelector('#q-notify');
      if (notify) notify.remove();
    }).catch(() => {});
  }

  /**
   * Click an order row by order number
   */
  async clickOrderRow(orderNumber: string): Promise<void> {
    await this.expectTableLoaded();
    await this.dismissPromoBanners();
    const row = this.tableRows.filter({ hasText: orderNumber }).first();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.scrollIntoViewIfNeeded().catch(() => {});
    await row.click();
  }

  /**
   * Click the first available order row in the table
   */
  async clickFirstOrderRow(): Promise<void> {
    await this.expectTableLoaded();
    await this.dismissPromoBanners();
    const count = await this.getRowCount();
    if (count === 0) {
      throw new Error(`Cannot click first order row: table has no records.`);
    }
    const row = this.tableRows.first();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await row.scrollIntoViewIfNeeded().catch(() => {});
    await row.click();
  }
}


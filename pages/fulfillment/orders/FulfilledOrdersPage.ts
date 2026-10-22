import { expect, Page } from '@playwright/test';
import { BaseOrdersPage } from './BaseOrdersPage';

/**
 * Fulfillment Fulfilled Orders Page
 * Route: /fulfilled-orders
 */
export class FulfilledOrdersPage extends BaseOrdersPage {
  protected readonly path = '/fulfilled-orders';

  constructor(page: Page) {
    super(page);
  }

  async expectOnFulfilledPage(): Promise<void> {
    await expect(this.page).toHaveURL(/fulfilled-orders/i, { timeout: 15000 });
    await this.expectTitle(/Fulfilled Orders/i);
  }

  /**
   * Verify an order row is visible in Fulfilled Orders table
   */
  async expectOrderRowVisible(orderNumber: string): Promise<void> {
    await this.expectTableLoaded();
    let row = this.tableRows.filter({ hasText: orderNumber }).first();
    if (!(await row.isVisible({ timeout: 2000 }).catch(() => false))) {
      console.log(`Fulfilled order ${orderNumber} not visible in table, re-triggering search...`);
      await this.search(orderNumber);
      row = this.tableRows.filter({ hasText: orderNumber }).first();
    }
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await expect(row).toBeVisible();
  }
}


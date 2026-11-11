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
    await this.search(orderNumber);
    await this.expectTableLoaded();
    const row = this.page.locator('.q-table tbody tr:visible, table tbody tr:visible')
      .filter({ hasText: orderNumber })
      .first();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await expect(row).toBeVisible();
  }
}


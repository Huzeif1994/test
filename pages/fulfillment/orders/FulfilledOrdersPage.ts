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
   * Verify an order row is visible in Fulfilled Orders table with resilient eventual consistency polling
   */
  async expectOrderRowVisible(orderNumber: string, maxAttempts: number = 8): Promise<void> {
    await this.expectTableLoaded();
    const searchTarget = orderNumber.includes('_') ? orderNumber.split('_')[1] : orderNumber;
    const row = this.page.locator('.q-table tbody tr:visible, table tbody tr:visible')
      .filter({ hasText: orderNumber })
      .or(this.page.locator('.q-table tbody tr:visible, table tbody tr:visible').filter({ hasText: searchTarget }))
      .first();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.search(orderNumber);
      await this.expectTableLoaded();

      if (await row.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false)) {
        console.log(`Fulfilled order ${orderNumber} located on attempt ${attempt}/${maxAttempts}.`);
        await expect(row).toBeVisible();
        return;
      }

      // Try searching with receipt suffix if full orderNumber didn't match immediately
      if (searchTarget !== orderNumber) {
        await this.search(searchTarget);
        await this.expectTableLoaded();
        if (await row.waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false)) {
          console.log(`Fulfilled order ${orderNumber} (receipt ${searchTarget}) located on attempt ${attempt}/${maxAttempts}.`);
          await expect(row).toBeVisible();
          return;
        }
      }

      if (attempt < maxAttempts) {
        console.log(`Fulfillment: Fulfilled order ${orderNumber} syncing, refreshing table (attempt ${attempt}/${maxAttempts})...`);
        await this.page.waitForTimeout(1500);
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        await this.expectTableLoaded();
      }
    }

    await row.waitFor({ state: 'visible', timeout: 5000 });
    await expect(row).toBeVisible();
  }
}


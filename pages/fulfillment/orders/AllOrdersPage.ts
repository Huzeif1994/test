import { expect, Page } from '@playwright/test';
import { BaseOrdersPage } from './BaseOrdersPage';

/**
 * Fulfillment All Orders Page
 * Route: /all-orders
 */
export class AllOrdersPage extends BaseOrdersPage {
  protected readonly path = '/all-orders';

  constructor(page: Page) {
    super(page);
  }

  async expectOnAllOrdersPage(): Promise<void> {
    await expect(this.page).toHaveURL(/all-orders/i, { timeout: 15000 });
    await this.expectTitle(/All Orders/i);
  }
}


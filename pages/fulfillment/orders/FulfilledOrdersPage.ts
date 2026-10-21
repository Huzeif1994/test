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
}


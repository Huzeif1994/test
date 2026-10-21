import { expect, Page } from '@playwright/test';
import { BaseOrdersPage } from './BaseOrdersPage';

/**
 * Fulfillment In Progress Orders Page
 * Route: /in-progress-orders
 */
export class InProgressOrdersPage extends BaseOrdersPage {
  protected readonly path = '/in-progress-orders';

  constructor(page: Page) {
    super(page);
  }

  async expectOnInProgressPage(): Promise<void> {
    await expect(this.page).toHaveURL(/in-progress-orders/i, { timeout: 15000 });
    await this.expectTitle(/In[\s-]*Progress Orders/i);
  }
}


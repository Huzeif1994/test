import { expect, Page } from '@playwright/test';
import { BaseOrdersPage } from './BaseOrdersPage';

/**
 * Fulfillment Pending Orders Page
 * Route: /pending-order
 */
export class PendingOrdersPage extends BaseOrdersPage {
  protected readonly path = '/pending-order';

  constructor(page: Page) {
    super(page);
  }

  async expectOnPendingPage(): Promise<void> {
    await expect(this.page).toHaveURL(/pending-order/i, { timeout: 15000 });
    await this.expectTitle(/Pending Orders/i);
  }

  /**
   * Click an order to start picking it (navigates to /pick-orders/:id)
   */
  async startPicking(orderNumber?: string): Promise<void> {
    if (orderNumber) {
      await this.clickOrderRow(orderNumber);
    } else {
      await this.clickFirstOrderRow();
    }
    await expect(this.page).toHaveURL(/pick-orders/i, { timeout: 20000 });
  }
}


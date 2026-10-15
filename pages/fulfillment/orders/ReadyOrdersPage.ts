import { expect, Page } from '@playwright/test';
import { BaseOrdersPage } from './BaseOrdersPage';

/**
 * Fulfillment Ready Orders Page
 * Route: /ready-orders
 */
export class ReadyOrdersPage extends BaseOrdersPage {
  protected readonly path = '/ready-orders';

  constructor(page: Page) {
    super(page);
  }

  async expectOnReadyPage(): Promise<void> {
    await expect(this.page).toHaveURL(/ready-orders/i, { timeout: 15000 });
    await this.expectTitle(/Ready Orders/i);
  }

  /**
   * Click an order to open the Store Pickup / Curbside handover screen
   * Navigates to /store-pickup/:orderId
   */
  async openOrderForHandover(orderNumber?: string): Promise<void> {
    if (orderNumber) {
      await this.clickOrderRow(orderNumber);
    } else {
      await this.clickFirstOrderRow();
    }
    await expect(this.page).toHaveURL(/store-pickup|ship-orders|schedule-delivery/i, { timeout: 20000 });
  }
}


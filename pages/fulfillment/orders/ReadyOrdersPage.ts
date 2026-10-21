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
    await expect(this.page).toHaveURL(/order|store-pickup|ship-orders|schedule-delivery/i, { timeout: 20000 });
  }

  /**
   * Verify "YES, Payment Due" is displayed in the table listing for the given order
   */
  async expectPaymentDue(orderNumber: string): Promise<void> {
    await this.expectTableLoaded();
    const row = this.page.locator('.q-table tbody tr, .ftx-table__body .ftx-table__tr, table tbody tr')
      .filter({ hasText: orderNumber })
      .first();
    await row.waitFor({ state: 'visible', timeout: 15000 });
    await expect(row).toContainText(/YES\s*,\s*Payment Due/i);
  }

  /**
   * Inside Order Detail, verify Payment Method card displays "Pay At Store"
   * Matches snippet:
   * <div class="order-summary-card">...Payment Method...Pay At Store...<i data-icon="payatstore">...
   */
  async verifyPayAtStorePaymentMethod(): Promise<void> {
    const card = this.page.locator('.order-summary-card, .q-card').filter({ hasText: /Payment Method/i }).first();
    await card.waitFor({ state: 'visible', timeout: 15000 });
    await expect(card).toBeVisible();

    // Verify title and label
    const title = card.locator('.order-summary-card__header, .text-subtitle2').filter({ hasText: /Payment Method/i }).first();
    await expect(title).toBeVisible();

    const payAtStoreLabel = card.locator('.order-summary-list__title, .q-item__label').filter({ hasText: /^Pay At Store$/i }).first();
    await expect(payAtStoreLabel).toBeVisible();

    // Verify pay at store icon
    const icon = card.locator('[data-icon="payatstore"], i:has(svg use[xlink\\:href*="payatstore"]), .payment-entry__icon').first();
    await expect(icon).toBeVisible();
  }
}


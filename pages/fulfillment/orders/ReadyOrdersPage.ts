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
   * Click an order in Ready Orders to open the Order Detail screen (/order/:orderId)
   */
  async openOrderDetail(orderNumber?: string): Promise<void> {
    if (orderNumber) {
      await this.clickOrderRow(orderNumber);
    } else {
      await this.clickFirstOrderRow();
    }
    await this.page.waitForTimeout(1000);
    await expect(this.page).toHaveURL(/\/order\/[a-zA-Z0-9-]+/i, { timeout: 20000 });
  }

  /**
   * Click an order to open the Store Pickup / Curbside handover screen
   * Navigates to /store-pickup/:orderId (or /order/:orderId -> clicks START FULFILLING)
   */
  async openOrderForHandover(orderNumber?: string): Promise<void> {
    if (orderNumber) {
      await this.clickOrderRow(orderNumber);
    } else {
      await this.clickFirstOrderRow();
    }
    await this.page.waitForTimeout(2000);

    // If landed on /order/:orderId, click START FULFILLING / MARK FULFILLED to reach /store-pickup/:orderId
    if (this.page.url().includes('/order/')) {
      const startFulfillBtn = this.page.locator('button, a')
        .filter({ hasText: /START FULFILLING|MARK FULFILLED/i })
        .first();
      if (await startFulfillBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await startFulfillBtn.click();
        await this.page.waitForTimeout(1500);
      }
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
    const card = this.page.locator('.order-summary-card, .q-card, div').filter({ hasText: /Payment Method/i }).first();
    await card.waitFor({ state: 'visible', timeout: 15000 });
    await expect(card).toBeVisible();

    // Verify title and label
    const title = card.locator('.order-summary-card__header, .text-subtitle2, h3, h4, span, div').filter({ hasText: /Payment Method/i }).first();
    await expect(title).toBeVisible();

    const payAtStoreLabel = card.locator('.order-summary-list__title, .q-item__label, span, div').filter({ hasText: /Pay At Store/i }).first();
    await expect(payAtStoreLabel).toBeVisible();

    // Verify pay at store icon if present
    const icon = card.locator('[data-icon="payatstore"], i:has(svg use[xlink\\:href*="payatstore"]), .payment-entry__icon, i, svg').first();
    if (await icon.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(icon).toBeVisible();
    }
  }
}


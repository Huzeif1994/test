import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

/**
 * Fulfillment Store Pickup Order Detail Page
 * Route: /store-pickup/:orderId
 * Handles Order Items inspection, Customer Handover & triggers Age Verification
 */
export class StorePickupDetailPage extends BasePage {
  protected readonly path = '/store-pickup';

  readonly orderTitleLabel: Locator;
  readonly pickupTypeBadge: Locator;
  readonly continueButton: Locator;
  readonly backButton: Locator;
  readonly paidBadge: Locator;
  readonly packagesContainer: Locator;

  constructor(page: Page) {
    super(page);

    this.orderTitleLabel = page.locator('.q-toolbar label.text-caption, .q-toolbar-title').first();
    this.pickupTypeBadge = page.locator('text=/In Store Pickup|Curbside Pickup|Standard Shipping/i').first();
    this.continueButton = page.locator('button:has-text("CONTINUE"), button:has-text("Mark Fulfilled")').first();
    this.backButton = page.locator('button:has-text("Back")').first();
    this.paidBadge = page.locator('.q-chip:has-text("Paid"), text="Paid"').first();
    this.packagesContainer = page.locator('.container .inner-table-height').first();
  }

  /**
   * Verify we are on the Order Detail or Store Pickup handover page
   */
  async expectOnOrderDetail(orderNumber?: string): Promise<void> {
    await expect(this.page).toHaveURL(/order|store-pickup|ship-orders|schedule-delivery/i, { timeout: 20000 });
    await this.page.waitForTimeout(1000);

    if (orderNumber) {
      await expect(this.page.locator(`text=${orderNumber}`).first()).toBeVisible({ timeout: 15000 });
    }
  }

  /**
   * Click CONTINUE / Mark Fulfilled to start handover / trigger Age Verification modal
   */
  async clickContinue(): Promise<void> {
    // If on /order/:orderId, click "Mark Fulfilled" to enter Store Pickup screen
    const markFulfilledBtn = this.page.locator('button:has-text("Mark Fulfilled")').first();
    if (await markFulfilledBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await markFulfilledBtn.click();
      await this.page.waitForTimeout(1500);
    }

    // Now on /store-pickup, click CONTINUE / Mark Fulfilled
    const continueBtn = this.page.locator('button:has-text("CONTINUE"), button:has-text("Mark Fulfilled")').first();
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.click();
      await this.page.waitForTimeout(1000);
    }
  }

  /**
   * Click Back button to return to Ready Orders list
   */
  async goBack(): Promise<void> {
    await this.backButton.click();
    await expect(this.page).toHaveURL(/ready-orders/i, { timeout: 15000 });
  }
}


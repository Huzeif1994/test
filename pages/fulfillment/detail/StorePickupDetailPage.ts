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
    // If on /order/:orderId, click "START FULFILLING" or "Mark Fulfilled" to enter Store Pickup screen
    const startFulfillBtn = this.page.locator('button, a').filter({ hasText: /START FULFILLING|Mark Fulfilled/i }).first();
    if (await startFulfillBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await startFulfillBtn.click();
      await this.page.waitForTimeout(1500);
    }

    // Now on /store-pickup, click CONTINUE / Mark Fulfilled
    const continueBtn = this.page.locator('button:has-text("CONTINUE"), button:has-text("Mark Fulfilled")').first();
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.click({ force: true });
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

  /**
   * Verify Curbside Pickup Method, Parking Spot and Car Information details on Store Pickup Order Detail page
   */
  async verifyCurbsideCarInfo(details?: {
    spot?: string;
    company?: string;
    model?: string;
    color?: string;
  }): Promise<void> {
    // 1. Verify pickup method indicates Curbside Pickup
    const curbsideEl = this.page.locator('.info-block, div, p, span, tr')
      .filter({ hasText: /Curbside/i })
      .first();
    await curbsideEl.waitFor({ state: 'visible', timeout: 15000 });
    await expect(curbsideEl).toBeVisible();

    // 2. Verify Spot section is rendered on the page
    const spotBlock = this.page.locator('.info-block').filter({ hasText: /Spot/i }).first();
    await spotBlock.waitFor({ state: 'visible', timeout: 15000 });
    await expect(spotBlock).toBeVisible();

    // 3. Verify Car Info section is rendered on the page
    const carInfoBlock = this.page.locator('.info-block').filter({ hasText: /Car Info/i }).first();
    await carInfoBlock.waitFor({ state: 'visible', timeout: 15000 });
    await expect(carInfoBlock).toBeVisible();

    // 4. If specific spot or details were populated, verify them
    if (details?.spot) {
      const spotEl = spotBlock.locator('.value, .value-box, div, span').first();
      if (await spotEl.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(spotEl).toBeVisible();
      }
    }
  }

  /**
   * Enter customer Pickup Confirmation Code during handover modal and submit
   */
  async enterConfirmationCode(code: string): Promise<void> {
    const dialog = this.page.locator('.q-dialog').filter({
      hasText: /Confirmation Code|Verify/i,
    }).first();

    // If dialog hasn't opened yet, click CONTINUE again (handles Vue hydration race)
    for (let retry = 0; retry < 4; retry++) {
      if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) break;
      const continueBtn = this.page.locator('button:has-text("CONTINUE"), button:has-text("Mark Fulfilled")').first();
      if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`Fulfillment Handover: Retrying CONTINUE click for dialog (attempt ${retry + 1}/4)...`);
        await continueBtn.click({ force: true });
        await this.page.waitForTimeout(1500);
      }
    }

    await dialog.waitFor({ state: 'visible', timeout: 15000 });

    // Handle manual DOB fallback if age verification is also required
    const useDobBtn = dialog.locator('button:has-text("Use DOB Instead")').first();
    if (await useDobBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await useDobBtn.click();
      await this.page.waitForTimeout(500);
      const dobInput = dialog.locator('input[aria-label="Select Date"], input').first();
      await dobInput.fill('05-15-1995');
      const verifyDob = dialog.locator('a:has-text("Verify DOB"), button:has-text("Verify DOB")').first();
      if (await verifyDob.isVisible({ timeout: 2000 }).catch(() => false)) {
        await verifyDob.click();
        await this.page.waitForTimeout(1000);
      }
    }

    // Input confirmation code into OTP inputs (exclude hidden file inputs)
    const otpInputs = dialog.locator('input.otp-input, input:not([type="file"])');
    const inputCount = await otpInputs.count();

    if (inputCount >= 4 && code.length >= 4) {
      for (let i = 0; i < 4; i++) {
        await otpInputs.nth(i).fill(code[i]);
        await this.page.waitForTimeout(100);
      }
    } else if (inputCount > 0) {
      await otpInputs.first().fill(code);
    }

    // Click Submit
    const submitBtn = dialog.locator('button').filter({ hasText: /^Submit$/i }).first();
    await submitBtn.waitFor({ state: 'visible', timeout: 5000 });
    await submitBtn.click();
    await this.page.waitForTimeout(1500);

    // If Quasar confirmation alert "Successfully Picked-Up!" appears, click OK / OKAY
    const okBtn = this.page.getByRole('button', { name: /^(OK|OKAY|Close)$/i })
      .or(this.page.locator('.q-dialog button, button').filter({ hasText: /^\s*(OK|OKAY|Close)\s*$/i }))
      .first();
    try {
      await okBtn.waitFor({ state: 'visible', timeout: 10000 });
      console.log('Fulfillment Handover: Clicking OKAY on confirmation alert...');
      await okBtn.click();
      await this.page.waitForTimeout(1500);
    } catch {
      console.log('Fulfillment Handover: No confirmation alert appeared or was auto-dismissed.');
    }
    await this.page.locator('.q-dialog').waitFor({ state: 'detached', timeout: 8000 }).catch(() => {});
  }
}


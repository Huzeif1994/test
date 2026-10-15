import { expect, Locator, Page } from '@playwright/test';

/**
 * Fulfillment Age Verification Modal Component
 * Matches src/components/curbside/verify-age.vue
 * Handles Driver's License upload, QR scan, and Manual DOB Fallback (Scenarios 4 & 5)
 */
export class VerifyAgeModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly dlOption: Locator;
  readonly qrOption: Locator;
  readonly useDobInsteadButton: Locator;
  readonly retryScanButton: Locator;
  readonly dobInput: Locator;
  readonly verifyDobLink: Locator;
  readonly wrongDobError: Locator;
  readonly dobMatchedSuccess: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Modal Container
    this.dialog = page.locator('.q-dialog').filter({
      hasText: /Driver's License|Age-Verified QR|Verify the person|DOB|Verification/i,
    }).first();

    // Verification Options
    this.dlOption = page.locator('text=/Click to Upload\\/Capture Driver\'s License/i').first();
    this.qrOption = page.locator('text=/Click to Scan Age-Verified QR/i').first();

    // Fallback Controls
    this.useDobInsteadButton = page.locator('button:has-text("Use DOB Instead")').first();
    this.retryScanButton = page.locator('button:has-text("Retry")').first();

    // Manual DOB Controls
    this.dobInput = this.dialog.locator('input[aria-label="Select Date"], input').first();
    this.verifyDobLink = page.locator('a:has-text("Verify DOB"), text="Verify DOB"').first();

    // Validation Feedback
    this.wrongDobError = page.locator('text="Wrong DOB entered!"').first();
    this.dobMatchedSuccess = page.locator('text="DOB Matched Successfully!"').first();

    // Close Button
    this.closeButton = this.dialog.locator('button:has(.q-icon), button[icon="close"], .dialogTitle button').first();
  }

  /**
   * Check if Age Verification modal is currently open on the screen
   */
  async isModalVisible(timeout: number = 5000): Promise<boolean> {
    return this.dialog.isVisible({ timeout }).catch(() => false);
  }

  /**
   * Expect the modal to be visible
   */
  async expectModalOpen(timeout: number = 15000): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout });
  }

  /**
   * Choose Driver's License verification path
   */
  async chooseDriverLicense(): Promise<void> {
    await this.dlOption.waitFor({ state: 'visible', timeout: 10000 });
    await this.dlOption.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Choose QR Code scan path
   */
  async chooseQrScan(): Promise<void> {
    await this.qrOption.waitFor({ state: 'visible', timeout: 10000 });
    await this.qrOption.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Click "Use DOB Instead" button to switch to manual Date of Birth fallback
   */
  async clickUseDobInstead(): Promise<void> {
    await this.useDobInsteadButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.useDobInsteadButton.click();
    await this.dobInput.waitFor({ state: 'visible', timeout: 5000 });
  }

  /**
   * Enter Date of Birth in MM-DD-YYYY format
   */
  async enterDOB(dob: string): Promise<void> {
    await this.dobInput.waitFor({ state: 'visible', timeout: 5000 });
    await this.dobInput.fill(dob);
    await this.page.waitForTimeout(300);
  }

  /**
   * Click "Verify DOB" link to submit manual DOB verification
   */
  async submitDOB(): Promise<void> {
    await this.verifyDobLink.waitFor({ state: 'visible', timeout: 5000 });
    await this.verifyDobLink.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Assert that "Wrong DOB entered!" error is displayed (Negative Test)
   */
  async expectWrongDobError(timeout: number = 10000): Promise<void> {
    await expect(this.wrongDobError).toBeVisible({ timeout });
  }

  /**
   * Assert that "DOB Matched Successfully!" message is displayed (Positive Test)
   */
  async expectDobSuccess(timeout: number = 10000): Promise<void> {
    await expect(this.dobMatchedSuccess).toBeVisible({ timeout });
  }

  /**
   * Close the Age Verification modal
   */
  async close(): Promise<void> {
    if (await this.closeButton.isVisible().catch(() => false)) {
      await this.closeButton.click();
      await this.dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  }
}


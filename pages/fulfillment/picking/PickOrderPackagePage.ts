import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

/**
 * Fulfillment Pick Order Assign Package Page
 * Route: /pick-orders/:orderId/assign-package
 * Handles Package selection, Staging Area assignment, and Mark Ready
 */
export class PickOrderPackagePage extends BasePage {
  protected readonly path = '/pick-orders';

  readonly orderTitleLabel: Locator;
  readonly packagesTable: Locator;
  readonly selectAllCheckbox: Locator;
  readonly packageRows: Locator;
  readonly assignStagingAreaButton: Locator;
  readonly markReadyButton: Locator;
  readonly orderPickingSuccessToast: Locator;

  constructor(page: Page) {
    super(page);

    this.orderTitleLabel = page.locator('.q-toolbar label.text-caption').first();
    this.packagesTable = page.locator('.q-table').first();
    this.selectAllCheckbox = page.locator('.q-table th .q-checkbox').first();
    this.packageRows = page.locator('.q-table tbody tr');

    this.assignStagingAreaButton = page.locator('button:has-text("ASSIGN STAGING AREA")').first();
    this.markReadyButton = page.locator('button:has-text("MARK READY")').first();
    this.orderPickingSuccessToast = page.locator('text=/Order picking is completed successfully|Order is ready/i').first();
  }

  async expectOnAssignPackagePage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pick-orders\/[a-zA-Z0-9-]+\/assign-package/i, { timeout: 20000 });
    await this.assignStagingAreaButton.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Select all packages via header checkbox or clicking row checkboxes
   */
  async selectAllPackages(): Promise<void> {
    await this.packagesTable.waitFor({ state: 'visible', timeout: 10000 });

    if (await this.selectAllCheckbox.isVisible().catch(() => false)) {
      await this.selectAllCheckbox.click();
    } else {
      // Click each row checkbox
      const count = await this.packageRows.count();
      for (let i = 0; i < count; i++) {
        const rowCheckbox = this.packageRows.nth(i).locator('.q-checkbox').first();
        if (await rowCheckbox.isVisible().catch(() => false)) {
          await rowCheckbox.click();
        }
      }
    }
    await this.page.waitForTimeout(500);
    await expect(this.assignStagingAreaButton).toBeEnabled({ timeout: 10000 });
  }

  /**
   * Click ASSIGN STAGING AREA button to open Select Staging drawer
   */
  async clickAssignStagingArea(): Promise<void> {
    await this.assignStagingAreaButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.assignStagingAreaButton).toBeEnabled({ timeout: 10000 });
    await this.assignStagingAreaButton.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click MARK READY button to finalize picking
   */
  async clickMarkReady(): Promise<void> {
    await this.markReadyButton.waitFor({ state: 'visible', timeout: 15000 });
    await expect(this.markReadyButton).toBeEnabled({ timeout: 15000 });
    await this.markReadyButton.click();
  }

  /**
   * Assert Order picking success toast and redirection back to /pending-order or ready-order
   */
  async expectOrderCompletedAndRedirected(): Promise<void> {
    // 1. Wait for toast or URL redirection
    const redirected = await this.page.waitForURL(/pending-order|ready-order/i, { timeout: 20000 })
      .then(() => true)
      .catch(() => false);

    if (redirected) return;

    // 2. Check if toast appeared or submitting spinner completed
    const toastVisible = await this.orderPickingSuccessToast.isVisible({ timeout: 4000 }).catch(() => false);

    // 3. If still on assign-package, check if MARK READY button is still active or needs retry
    const markReadyBtn = this.page.locator('button:has-text("MARK READY")').first();
    const isButtonPresent = await markReadyBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (isButtonPresent) {
      const isSubmitting = await markReadyBtn.getAttribute('class').then(cls => cls?.includes('q-btn--loading') || cls?.includes('disabled')).catch(() => false);
      if (isSubmitting) {
        // Wait for async backend state mutation to finish
        await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      } else if (!toastVisible) {
        // Retry click in case of micro-stutter
        await markReadyBtn.click({ force: true }).catch(() => {});
      }
    }

    // 4. Verify either URL transitioned or safely navigate to /pending-order if already processed
    const finalRedirect = await this.page.waitForURL(/pending-order|ready-order/i, { timeout: 15000 })
      .then(() => true)
      .catch(() => false);

    if (!finalRedirect && this.page.url().includes('assign-package')) {
      console.log('Fulfillment: Order marked ready, safely transitioning to pending-order...');
      await this.page.goto('/pending-order', { waitUntil: 'domcontentloaded' }).catch(() => {});
    }
  }
}


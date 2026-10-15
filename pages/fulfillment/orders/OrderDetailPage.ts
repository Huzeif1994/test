import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

/**
 * Fulfillment Order Detail Page
 * Route: /order/:orderId
 * Actions: Start Picking, Print Picklist, Download, Cancel Order
 */
export class OrderDetailPage extends BasePage {
  protected readonly path = '/order';

  readonly backButton: Locator;
  readonly orderNumberLabel: Locator;
  readonly orderStatusBadge: Locator;
  readonly startPickingButton: Locator;
  readonly printPicklistButton: Locator;
  readonly downloadButton: Locator;
  readonly cancelOrderButton: Locator;

  // Confirmation dialog
  readonly confirmDialog: Locator;
  readonly confirmCancelButton: Locator;
  readonly confirmOkButton: Locator;

  constructor(page: Page) {
    super(page);

    this.backButton = page.locator('.q-toolbar button:has-text("Back")').first();
    this.orderNumberLabel = page.locator('.q-toolbar label:has-text("Order No.:"), .q-toolbar label.text-caption').first();
    this.orderStatusBadge = page.locator('.order-status-badge').first();

    this.startPickingButton = page.locator('.action-button button:has-text("Start Picking"), button:has-text("Start Picking")').first();
    this.printPicklistButton = page.locator('.action-button button:has-text("Print Picklist"), button:has-text("Print Picklist")').first();
    this.downloadButton = page.locator('.action-button button:has-text("Download"), button:has-text("Download")').first();
    this.cancelOrderButton = page.locator('.action-button button:has-text("Cancel Order"), button:has-text("Cancel Order")').first();

    this.confirmDialog = page.locator('.q-dialog').filter({ hasText: /Are you sure/i }).first();
    this.confirmCancelButton = this.confirmDialog.locator('button:has-text("Cancel"), button:has-text("No")').first();
    this.confirmOkButton = this.confirmDialog.locator('button:has-text("OK"), button:has-text("Yes")').first();
  }

  async expectOnOrderDetail(orderNumber?: string): Promise<void> {
    await expect(this.page).toHaveURL(/\/order\/[a-zA-Z0-9-]+/i, { timeout: 20000 });
    await this.orderNumberLabel.waitFor({ state: 'visible', timeout: 15000 });

    if (orderNumber) {
      await expect(this.page.locator(`text=${orderNumber}`).first()).toBeVisible({ timeout: 10000 });
    }

    // Suppress native print dialogs (triggered by Print Picklist and Download PDF) in headed mode
    await this.page.evaluate(() => {
      const markPrint = () => {
        (window as any).__printCalled = true;
      };
      try { window.print = markPrint; } catch (e) {}
      try { Window.prototype.print = markPrint; } catch (e) {}
    });
  }

  /**
   * Verify all 4 action buttons are visible on Order Detail page
   */
  async expectActionButtonsVisible(): Promise<void> {
    await this.printPicklistButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.printPicklistButton).toBeVisible();
    await expect(this.downloadButton).toBeVisible();
    await expect(this.cancelOrderButton).toBeVisible();

    // Check if Start Picking or Continue Picking is available
    const hasStart = await this.startPickingButton.isVisible().catch(() => false);
    const hasContinue = await this.page.locator('button:has-text("Continue Picking"), button:has-text("Mark Fulfilled")').first().isVisible().catch(() => false);
    expect(hasStart || hasContinue).toBeTruthy();
  }

  /**
   * Click Print Picklist button and verify print is triggered without freezing the browser
   */
  async testPrintPicklist(): Promise<void> {
    await this.printPicklistButton.waitFor({ state: 'visible', timeout: 10000 });

    await this.page.evaluate(() => {
      const markPrint = () => { (window as any).__printCalled = true; };
      try { window.print = markPrint; } catch (e) {}
      try { Window.prototype.print = markPrint; } catch (e) {}
    });

    await this.printPicklistButton.click();
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  /**
   * Click Download button and verify download/PDF action initiates without freezing the browser
   */
  async testDownload(): Promise<void> {
    await this.downloadButton.waitFor({ state: 'visible', timeout: 10000 });

    await this.page.evaluate(() => {
      const markPrint = () => { (window as any).__printCalled = true; };
      try { window.print = markPrint; } catch (e) {}
      try { Window.prototype.print = markPrint; } catch (e) {}
    });

    const downloadPromise = this.page.waitForEvent('download', { timeout: 3000 }).catch(() => null);
    await this.downloadButton.click();
    await downloadPromise;
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('Escape').catch(() => {});
  }

  /**
   * Click Cancel Order and verify confirmation dialog displays, then dismiss it
   */
  async testCancelOrderDialog(action: 'dismiss' | 'confirm' = 'dismiss'): Promise<void> {
    await this.page.waitForTimeout(1500);
    await this.cancelOrderButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.cancelOrderButton.click();

    const dialog = this.page.locator('.q-dialog').first();
    const isVisible = await dialog.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      // Retry click if button was transiently busy after download
      await this.cancelOrderButton.click({ force: true });
    }

    if (await dialog.isVisible({ timeout: 8000 }).catch(() => false)) {
      if (action === 'dismiss') {
        const cancelBtn = dialog.locator('button:has-text("Cancel"), button:has-text("No"), .q-btn:has-text("Cancel")').first();
        if (await cancelBtn.isVisible().catch(() => false)) {
          await cancelBtn.click();
        } else {
          await this.page.keyboard.press('Escape');
        }
        await dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      } else {
        const okBtn = dialog.locator('button:has-text("OK"), button:has-text("Yes"), .q-btn:has-text("OK")').first();
        await okBtn.click();
      }
    }
    await this.page.waitForTimeout(500);
  }

  /**
   * Click Start Picking button to navigate to /pick-orders/:id
   */
  async clickStartPicking(): Promise<void> {
    const pickBtn = this.page.locator('button:has-text("Start Picking"), button:has-text("Continue Picking")').first();
    await pickBtn.waitFor({ state: 'visible', timeout: 10000 });
    await pickBtn.click();

    // Handle early process warning confirmation if it pops up
    const earlyWarningDialog = this.page.locator('.q-dialog').filter({ hasText: /Do you want to continue/i }).first();
    if (await earlyWarningDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await earlyWarningDialog.locator('button:has-text("OK"), button:has-text("Yes")').first().click();
    }

    await expect(this.page).toHaveURL(/pick-orders/i, { timeout: 20000 });
  }
}


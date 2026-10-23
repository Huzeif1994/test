import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';
import { ItemInfoDrawer } from '../modals/ItemInfoDrawer';

/**
 * Fulfillment Pick Order Detail Page
 * Route: /pick-orders/:orderId
 * Handles Order picking, item list, drawer trigger, and Next button
 */
export class PickOrderDetailPage extends BasePage {
  protected readonly path = '/pick-orders';

  readonly backButton: Locator;
  readonly printPicklistButton: Locator;
  readonly cancelOrderButton: Locator;
  readonly orderTitleLabel: Locator;
  readonly productRows: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    super(page);

    this.backButton = page.locator('.q-toolbar button:has-text("Back")').first();
    this.printPicklistButton = page.locator('.q-toolbar button:has-text("Print Picklist")').first();
    this.cancelOrderButton = page.locator('.q-toolbar button:has-text("Cancel Order")').first();
    this.orderTitleLabel = page.locator('.q-toolbar label.text-caption').first();

    this.productRows = page.locator('.ftx-table__body .ftx-table__tr');
    this.nextButton = page.locator('.form-action button:has-text("Next"), .form-action button:has-text("MARK READY")').first();
  }

  async expectOnPickOrderPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/pick-orders\/[a-zA-Z0-9-]+(?!\/assign-package)/i, { timeout: 20000 });
    await this.orderTitleLabel.waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Verify header buttons (Print Picklist, Cancel Order)
   */
  async expectHeaderActionsVisible(): Promise<void> {
    const hasPrint = await this.printPicklistButton.isVisible().catch(() => false);
    const hasCancel = await this.cancelOrderButton.isVisible().catch(() => false);
    expect(hasPrint || hasCancel).toBeTruthy();
  }

  /**
   * Get count of product rows in the pick table
   */
  async getProductCount(): Promise<number> {
    await this.page.waitForTimeout(1000);
    return this.productRows.count();
  }

  /**
   * Click a product row to open the Item Info drawer
   */
  async clickProductRow(index: number = 0): Promise<void> {
    const count = await this.getProductCount();
    if (count === 0) {
      throw new Error('No product rows found on Pick Order page.');
    }
    const row = this.productRows.nth(index);
    await row.waitFor({ state: 'visible', timeout: 10000 });
    await row.scrollIntoViewIfNeeded().catch(() => {});
    await row.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Pick all unpicked items in the table (including linked products and physical gift card barcodes)
   */
  async pickAllItems(itemInfoDrawer: ItemInfoDrawer, giftCardNumber?: string): Promise<void> {
    await this.page.waitForTimeout(1000);
    const mainRows = this.page.locator('.ftx-table__body > .ftx-table__tr');
    const count = await mainRows.count();

    for (let i = 0; i < count; i++) {
      const row = mainRows.nth(i);
      
      // 1. Pick Main Product if not picked
      const isPicked = await row.locator('.q-badge:has-text("Picked"), [class*="picked"]').first().isVisible().catch(() => false);
      if (!isPicked) {
        const titleCell = row.locator('.ftx-table__td__title, .ftx-table__td.w-40, .ftx-table__td').first();
        await titleCell.click();
        await itemInfoDrawer.expectDrawerOpen();
        await itemInfoDrawer.selectPickedQty();
        if (giftCardNumber) {
          await itemInfoDrawer.handlePhysicalGiftCardBarcode(giftCardNumber);
        }
        await itemInfoDrawer.clickDone();
        // Check if barcode dialog opened after clicking Done
        if (giftCardNumber) {
          await itemInfoDrawer.handlePhysicalGiftCardBarcode(giftCardNumber);
        }
        await this.page.waitForTimeout(600);
      }

      // 2. Expand Linked Product section if collapsed
      const linkedBtn = row.locator('.linked-product__title, button, .q-btn').filter({ hasText: /Linked Product/i }).first();
      if (await linkedBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await linkedBtn.click().catch(() => {});
        await this.page.waitForTimeout(400);
      }

      // 3. Pick any Linked Product rows inside this row
      const linkedRows = row.locator('.linked-product__row');
      const linkedCount = await linkedRows.count();
      for (let j = 0; j < linkedCount; j++) {
        const linkedRow = linkedRows.nth(j);
        const isLinkedPicked = await linkedRow.locator('.q-badge:has-text("Picked"), [class*="picked"]').first().isVisible().catch(() => false);
        if (!isLinkedPicked) {
          const linkedCell = linkedRow.locator('.ftx-table__td.w-40, span.text-dark, .ftx-table__td').first();
          await linkedCell.click();
          await itemInfoDrawer.expectDrawerOpen();
          await itemInfoDrawer.selectPickedQty();
          await itemInfoDrawer.clickDone();
          await this.page.waitForTimeout(600);
        }
      }
    }

    // Safety sweep: Check all linked products on the page
    const allLinkedRows = this.page.locator('.linked-product__row');
    const totalLinked = await allLinkedRows.count();
    for (let k = 0; k < totalLinked; k++) {
      const linkedRow = allLinkedRows.nth(k);
      const isLinkedPicked = await linkedRow.locator('.q-badge:has-text("Picked"), [class*="picked"]').first().isVisible().catch(() => false);
      if (!isLinkedPicked) {
        const linkedCell = linkedRow.locator('.ftx-table__td.w-40, span.text-dark, .ftx-table__td').first();
        await linkedCell.click();
        await itemInfoDrawer.expectDrawerOpen();
        await itemInfoDrawer.selectPickedQty();
        await itemInfoDrawer.clickDone();
        await this.page.waitForTimeout(600);
      }
    }
  }

  /**
   * Click Next button to proceed to Delivery Options or Assign Package
   */
  async clickNext(): Promise<void> {
    await this.nextButton.waitFor({ state: 'visible', timeout: 15000 });
    // Wait until enabled
    await expect(this.nextButton).toBeEnabled({ timeout: 15000 });
    await this.nextButton.click();

    // Check if early processing confirmation appears
    const confirmDialog = this.page.locator('.q-dialog').filter({ hasText: /Do you want to continue/i }).first();
    if (await confirmDialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmDialog.locator('button:has-text("OK"), button:has-text("Yes")').first().click();
    }

    await this.page.waitForTimeout(1500);
  }
}


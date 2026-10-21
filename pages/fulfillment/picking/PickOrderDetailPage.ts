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
   * Pick all unpicked items in the table (including linked products if present)
   */
  async pickAllItems(itemInfoDrawer: ItemInfoDrawer): Promise<void> {
    await this.page.waitForTimeout(1000);
    const mainRows = this.page.locator('.ftx-table__body > .ftx-table__tr');
    const count = await mainRows.count();

    for (let i = 0; i < count; i++) {
      const row = mainRows.nth(i);
      const isPicked = await row.locator('.q-badge:has-text("Picked")').isVisible().catch(() => false);
      if (!isPicked) {
        await row.click();
        await itemInfoDrawer.expectDrawerOpen();
        await itemInfoDrawer.selectPickedQty();
        await itemInfoDrawer.clickDone();
        await this.page.waitForTimeout(500);
      }

      // Check for Linked Products button / pill
      const linkedBtn = row.locator('button, .q-btn, a, div').filter({ hasText: /Linked Product/i }).first();
      if (await linkedBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        await linkedBtn.click();
        await this.page.waitForTimeout(500);
        const linkedRows = this.page.locator('.linked-product__row, tr.linked, .linked-item');
        const linkedCount = await linkedRows.count();
        for (let j = 0; j < linkedCount; j++) {
          const linkedRow = linkedRows.nth(j);
          const isLinkedPicked = await linkedRow.locator('.q-badge:has-text("Picked"), [class*="picked"]').isVisible().catch(() => false);
          if (!isLinkedPicked) {
            await linkedRow.click();
            await itemInfoDrawer.expectDrawerOpen();
            await itemInfoDrawer.selectPickedQty();
            await itemInfoDrawer.clickDone();
            await this.page.waitForTimeout(500);
          }
        }
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


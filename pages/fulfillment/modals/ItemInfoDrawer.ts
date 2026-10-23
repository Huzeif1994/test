import { expect, Locator, Page } from '@playwright/test';

/**
 * Item Info Drawer Component
 * Matches src/components/item-info-dialog.vue
 * Opened when an item row is clicked on Pick Order Detail
 */
export class ItemInfoDrawer {
  readonly page: Page;
  readonly dialog: Locator;
  readonly productTitle: Locator;
  readonly expectedQtyBox: Locator;
  readonly pickedQtySelect: Locator;
  readonly doneButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.dialog = page.locator('.q-dialog').filter({
      hasText: /Currently Picking|Picked Qty|Expected/i,
    }).first();

    this.productTitle = this.dialog.locator('.dialogTitle h3').first();
    this.expectedQtyBox = this.dialog.locator('.info-box:has-text("Expected") .value').first();
    this.pickedQtySelect = this.dialog.locator('.q-select').filter({ hasText: /Picked Qty/i }).first();
    this.doneButton = this.dialog.locator('button:has-text("Done"), button:has-text("Submit")').first();
    this.closeButton = this.dialog.locator('.dialogTitle button[icon="close"], button:has-text("close")').first();
  }

  async isDrawerVisible(timeout: number = 5000): Promise<boolean> {
    return this.dialog.isVisible({ timeout }).catch(() => false);
  }

  async expectDrawerOpen(timeout: number = 15000): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout });
    await this.pickedQtySelect.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Select Picked Quantity from dropdown (defaults to Expected or max option)
   */
  async selectPickedQty(quantity?: number | string): Promise<void> {
    await this.pickedQtySelect.waitFor({ state: 'visible', timeout: 10000 });
    await this.pickedQtySelect.click();
    await this.page.waitForTimeout(500);

    const menu = this.page.locator('.q-menu, .q-virtual-scroll__content').first();
    await menu.waitFor({ state: 'visible', timeout: 5000 });

    if (quantity !== undefined) {
      const option = menu.locator(`.q-item:has-text("${quantity}")`).first();
      await option.click();
    } else {
      // Pick the last option (full expected quantity)
      const options = menu.locator('.q-item');
      const count = await options.count();
      if (count > 0) {
        await options.last().click();
      }
    }

    await this.page.waitForTimeout(300);
  }

  /**
   * Click Done button to submit picked item (resilient if already submitted/closed)
   */
  async clickDone(): Promise<void> {
    const isDialogVisible = await this.dialog.isVisible({ timeout: 1500 }).catch(() => false);
    if (!isDialogVisible) {
      return;
    }
    if (await this.doneButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await this.doneButton.click();
      await this.dialog.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  /**
   * Handle Physical Gift Card 12-digit barcode entry if prompted during picking.
   * Matches prompt: "Scan Gift Card’s Barcode or manually enter the 12-digit gift card number"
   * and field "Physical Gift Card 1" (or 2, etc.)
   */
  async handlePhysicalGiftCardBarcode(cardNumber: string, index: number = 1): Promise<boolean> {
    await this.page.waitForTimeout(1000);
    const barcodePrompt = this.page.locator('text=/Scan Gift Card.*Barcode|manually enter.*12-digit|Physical Gift Card/i').first();
    const isVisible = await barcodePrompt.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isVisible) {
      return false;
    }

    console.log(`Fulfillment: Physical Gift Card prompt detected. Assigning 12-digit number: ${cardNumber}`);

    // Locate the specific field for Physical Gift Card index
    const inputField = this.page.getByLabel(new RegExp(`Physical Gift Card ${index}`, 'i'))
      .or(this.page.locator('.q-input, .q-field').filter({ hasText: new RegExp(`Physical Gift Card ${index}`, 'i') }).locator('input'))
      .or(this.page.locator(`input[placeholder*="12-digit"], input[placeholder*="Physical Gift Card"]`))
      .or(this.page.locator('input[type="text"]').filter({ has: this.page.locator('text=/Physical Gift Card/i') }))
      .or(this.page.locator('.q-dialog input[type="text"], .q-dialog input[type="number"]'))
      .first();

    await inputField.waitFor({ state: 'visible', timeout: 10000 });
    await inputField.fill(cardNumber);
    await this.page.waitForTimeout(500);

    // Click Submit / Done button
    const submitBtn = this.page.getByRole('button', { name: /^Submit$|^Done$/i })
      .or(this.page.locator('.q-dialog button:has-text("Submit"), .q-dialog button:has-text("Done")'))
      .or(this.page.locator('button:has-text("Submit"), button:has-text("Done")'))
      .first();

    await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await submitBtn.click();
    await this.page.waitForTimeout(1000);
    console.log(`Fulfillment: Successfully submitted 12-digit card number ${cardNumber}`);
    return true;
  }
}


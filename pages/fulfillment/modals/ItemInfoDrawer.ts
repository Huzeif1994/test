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
   * Click Done button to submit picked item
   */
  async clickDone(): Promise<void> {
    await this.doneButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.doneButton.click();
    await this.dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }
}


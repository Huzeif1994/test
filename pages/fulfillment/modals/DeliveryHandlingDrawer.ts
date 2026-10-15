import { expect, Locator, Page } from '@playwright/test';

/**
 * Delivery Handling Options Drawer Component
 * Matches src/components/pick-order/print-label-count.vue
 * Handles Delivery Partner options, expected package size, instructions, and package label count
 */
export class DeliveryHandlingDrawer {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleLabel: Locator;

  // Step 1 Controls
  readonly orderContainsList: Locator;
  readonly packageSizeSelect: Locator;
  readonly pickupInstructionsInput: Locator;
  readonly nextButton: Locator;

  // Step 2 Controls
  readonly packageCountInput: Locator;

  constructor(page: Page) {
    this.page = page;

    this.dialog = page.locator('.q-dialog').filter({
      hasText: /Delivery Handling Options|Print Packaging Labels/i,
    }).first();

    this.titleLabel = this.dialog.locator('.dialogTitle h3').first();
    this.orderContainsList = this.dialog.locator('.contains-options-list, text=/Contains/i').first();
    this.packageSizeSelect = this.dialog.locator('.q-select').filter({ hasText: /package size/i }).first();
    this.pickupInstructionsInput = this.dialog.locator('input[aria-label="Enter instructions "], input[counter]').first();
    this.nextButton = this.dialog.locator('button:has-text("Next")').first();
    this.packageCountInput = this.dialog.locator('input[type="number"], .qty-input-box input').first();
  }

  async isDrawerVisible(timeout: number = 5000): Promise<boolean> {
    return this.dialog.isVisible({ timeout }).catch(() => false);
  }

  async expectDrawerOpen(timeout: number = 15000): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout });
  }

  /**
   * Complete delivery handling step 1 and step 2
   */
  async completeDeliveryHandling(options?: {
    containsType?: 'Contains Liqour' | 'Contains Tobacco' | 'Contains Both';
    packageSizeIndex?: number;
    instructions?: string;
  }): Promise<void> {
    await this.expectDrawerOpen();

    // Check if Step 1 is active (Delivery Handling Options)
    const isStep1 = await this.titleLabel.innerText().then(t => t.includes('Delivery Handling Options')).catch(() => false);

    if (isStep1) {
      // If age restricted options are present, select one
      const radio = this.dialog.locator('.contains-option-row, .q-radio').last();
      if (await radio.isVisible({ timeout: 2000 }).catch(() => false)) {
        await radio.scrollIntoViewIfNeeded().catch(() => {});
        await radio.click();
        await this.page.waitForTimeout(500);
      }

      // Select expected package size if empty
      if (await this.packageSizeSelect.isVisible().catch(() => false)) {
        const text = await this.packageSizeSelect.innerText().catch(() => '');
        if (!text || text.includes('Select expected')) {
          await this.packageSizeSelect.click();
          await this.page.waitForTimeout(500);
          const menu = this.page.locator('.q-menu').first();
          if (await menu.isVisible({ timeout: 3000 }).catch(() => false)) {
            const sizeOption = menu.locator('.q-item').first();
            await sizeOption.click();
            await this.page.waitForTimeout(300);
          }
        }
      }

      // Enter pickup instructions if input is present
      if (await this.pickupInstructionsInput.isVisible().catch(() => false)) {
        const currentVal = await this.pickupInstructionsInput.inputValue().catch(() => '');
        if (!currentVal) {
          await this.pickupInstructionsInput.fill(options?.instructions || 'Handle with care. Fragile items.');
        }
      }

      // Click Next to go to Step 2
      const step1Next = this.dialog.locator('button:has-text("NEXT"), button:has-text("Next")').first();
      await step1Next.waitFor({ state: 'visible', timeout: 5000 });
      await step1Next.click();
      await this.page.waitForTimeout(1500);
    }

    // Step 2: Print Packaging Labels
    const isStep2 = await this.dialog.isVisible().catch(() => false);
    if (isStep2) {
      const step2Next = this.dialog.locator('button:has-text("NEXT"), button:has-text("Next")').first();
      if (await step2Next.isVisible({ timeout: 5000 }).catch(() => false)) {
        await step2Next.click();
        await this.dialog.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {});
      }
    }

    await this.page.waitForTimeout(1000);
  }
}


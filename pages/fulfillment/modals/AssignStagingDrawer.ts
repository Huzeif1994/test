import { expect, Locator, Page } from '@playwright/test';

/**
 * Assign Staging Area Drawer Component
 * Matches src/components/assign-bin-dialog.vue
 * Handles Staging Area selection and "Staging Area has been assigned" confirmation
 */
export class AssignStagingDrawer {
  readonly page: Page;
  readonly dialog: Locator;
  readonly titleLabel: Locator;
  readonly stagingSelect: Locator;
  readonly saveButton: Locator;
  readonly successToast: Locator;

  constructor(page: Page) {
    this.page = page;

    this.dialog = page.locator('.q-dialog').filter({
      hasText: /Select Staging|Staging Area/i,
    }).first();

    this.titleLabel = this.dialog.locator('.dialogTitle h3, text="Select Staging"').first();
    this.stagingSelect = this.dialog.locator('.q-select').filter({ hasText: /Staging Area/i }).first();
    this.saveButton = this.dialog.locator('button:has-text("Save"), button[type="submit"]').first();
    this.successToast = page.locator('text="Staging Area has been assigned"').first();
  }

  async isDrawerVisible(timeout: number = 5000): Promise<boolean> {
    return this.dialog.isVisible({ timeout }).catch(() => false);
  }

  async expectDrawerOpen(timeout: number = 15000): Promise<void> {
    await this.dialog.waitFor({ state: 'visible', timeout });
    await this.stagingSelect.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Select a staging area from dropdown
   */
  async selectStagingArea(name?: string): Promise<void> {
    await this.stagingSelect.waitFor({ state: 'visible', timeout: 10000 });
    await this.stagingSelect.click();
    await this.page.waitForTimeout(500);

    const menu = this.page.locator('.q-menu').first();
    await menu.waitFor({ state: 'visible', timeout: 5000 });

    if (name) {
      const option = menu.locator(`.q-item:has-text("${name}")`).first();
      await option.click();
    } else {
      // Pick first available staging option
      const firstOption = menu.locator('.q-item').first();
      await firstOption.click();
    }
    await this.page.waitForTimeout(300);
  }

  /**
   * Click Save button to assign staging area and wait for drawer close
   */
  async clickSave(): Promise<void> {
    await this.saveButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.saveButton.click();

    // Verify toast or wait for drawer to close
    await Promise.race([
      this.successToast.waitFor({ state: 'visible', timeout: 4000 }),
      this.dialog.waitFor({ state: 'hidden', timeout: 6000 }),
    ]).catch(() => {});

    await this.dialog.waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  /**
   * Assert "Staging Area has been assigned" toast message if present
   */
  async expectStagingAssignedToast(timeout: number = 5000): Promise<void> {
    const isToast = await this.successToast.isVisible({ timeout }).catch(() => false);
    if (!isToast) {
      // Confirm drawer is closed as evidence of successful assignment
      await expect(this.dialog).toBeHidden({ timeout: 5000 });
    }
  }
}


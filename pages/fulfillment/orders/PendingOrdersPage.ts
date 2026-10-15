import { expect, Locator, Page } from '@playwright/test';
import { BaseOrdersPage } from './BaseOrdersPage';

/**
 * Fulfillment Pending Orders Page
 * Route: /pending-order
 * Features: Brand Store Filter, Search, Pagination, and Row 5-Action Menu
 */
export class PendingOrdersPage extends BaseOrdersPage {
  protected readonly path = '/pending-order';

  readonly paginationBottom: Locator;
  readonly paginationRangeLabel: Locator;
  readonly paginationNextButton: Locator;
  readonly paginationPrevButton: Locator;
  readonly actionDropdownMenu: Locator;

  constructor(page: Page) {
    super(page);

    this.paginationBottom = page.locator('.q-table__bottom').first();
    this.paginationRangeLabel = page.locator('.q-table__bottom-item, .q-table__control').filter({ hasText: /of \d+/i }).first();
    this.paginationNextButton = page.locator('.q-table__bottom button').filter({ has: page.locator('i:has-text("chevron_right"), .q-icon[name="chevron_right"]') }).first();
    this.paginationPrevButton = page.locator('.q-table__bottom button').filter({ has: page.locator('i:has-text("chevron_left"), .q-icon[name="chevron_left"]') }).first();
    this.actionDropdownMenu = page.locator('.action-dropdown__menu, .action-menu, .q-menu').first();
  }

  async expectOnPendingPage(): Promise<void> {
    await expect(this.page).toHaveURL(/pending-order/i, { timeout: 15000 });
    await this.expectTitle(/Pending Orders/i);
  }

  /**
   * Interact with Brand Store Filter dropdown
   */
  async testBrandStoreFilter(): Promise<void> {
    await this.expectTableLoaded();
    const filter = this.page.locator('label:has-text("Select Brand Store"), .select-ellipsis').first();
    if (await filter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await filter.click();
      await this.page.waitForTimeout(500);
      const menu = this.page.locator('.q-menu').first();
      if (await menu.isVisible({ timeout: 2000 }).catch(() => false)) {
        const option = menu.locator('.q-item').first();
        if (await option.isVisible().catch(() => false)) {
          await option.click();
          await this.expectTableLoaded();
          return;
        }
      }
      await this.page.keyboard.press('Escape');
    }
  }

  /**
   * Test pagination controls (Read range, Click Next, Click Prev)
   */
  async testPagination(): Promise<void> {
    await this.expectTableLoaded();
    const count = await this.getRowCount();
    if (count === 0) return;

    // Check if pagination label is visible
    if (await this.paginationRangeLabel.isVisible().catch(() => false)) {
      const initialText = await this.paginationRangeLabel.textContent();

      // If next button is enabled, click it
      const isNextDisabled = await this.paginationNextButton.isDisabled().catch(() => true);
      if (!isNextDisabled) {
        await this.paginationNextButton.click();
        await this.expectTableLoaded();
        await this.page.waitForTimeout(1000);

        // Click previous button to return
        const isPrevDisabled = await this.paginationPrevButton.isDisabled().catch(() => true);
        if (!isPrevDisabled) {
          await this.paginationPrevButton.click();
          await this.expectTableLoaded();
          await this.page.waitForTimeout(1000);
        }
      }
    }
  }

  /**
   * Open the 3-dots action dropdown menu on a row
   */
  async openActionMenu(rowIndex: number = 0): Promise<void> {
    await this.expectTableLoaded();
    await this.dismissPromoBanners();
    const row = this.tableRows.nth(rowIndex);
    await row.waitFor({ state: 'visible', timeout: 15000 });

    const actionBtn = row.locator('td').last().locator('.action-dropdown, button, .q-btn').first();
    await actionBtn.waitFor({ state: 'visible', timeout: 10000 });
    await actionBtn.click();
    await this.actionDropdownMenu.waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Assert all 5 expected action options in the opened menu
   * 1. View Order
   * 2. Start Picking
   * 3. Print Picklist
   * 4. Download
   * 5. Cancel Order
   */
  async expectAll5Actions(): Promise<void> {
    await this.actionDropdownMenu.waitFor({ state: 'visible', timeout: 10000 });
    const expectedActions = [
      'View Order',
      'Start Picking',
      'Print Picklist',
      'Download',
      'Cancel Order',
    ];

    for (const action of expectedActions) {
      await expect(this.actionDropdownMenu.locator(`text="${action}"`).first()).toBeVisible({ timeout: 5000 });
    }
  }

  /**
   * Click an action from the opened dropdown menu
   */
  async clickActionMenuItem(actionLabel: string): Promise<void> {
    const item = this.actionDropdownMenu.locator(`text="${actionLabel}"`).first();
    await item.waitFor({ state: 'visible', timeout: 5000 });
    await item.click();
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click an order row to open Order Details (/order/:id)
   */
  async openOrderDetail(orderNumber?: string): Promise<void> {
    if (orderNumber) {
      await this.clickOrderRow(orderNumber);
    } else {
      await this.clickFirstOrderRow();
    }
    await expect(this.page).toHaveURL(/order/i, { timeout: 20000 });
  }
}

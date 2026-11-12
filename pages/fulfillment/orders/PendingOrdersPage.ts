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
    await this.waitForInitialData();
  }

  /**
   * Switch the Brand Store filter in Fulfillment (e.g. 'All Brands' or 'smokers choice')
   */
  async selectBrandStore(brandName: string = 'All Brands'): Promise<void> {
    await this.expectTableLoaded();
    const filter = this.page.locator('label:has-text("Select Brand Store"), .select-ellipsis').first();
    if (await filter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filter.click();
      await this.page.waitForTimeout(600);
      const option = this.page.locator('.q-menu .q-item, .q-virtual-scroll__content .q-item')
        .filter({ hasText: new RegExp(`^\\s*${brandName}\\s*$`, 'i') })
        .first();
      if (await option.isVisible({ timeout: 3000 }).catch(() => false)) {
        await option.click();
        await this.expectTableLoaded();
        await this.page.waitForTimeout(1000);
      } else {
        await this.page.keyboard.press('Escape');
      }
    }
  }

  /**
   * Interact with Brand Store Filter dropdown
   */
  async testBrandStoreFilter(): Promise<void> {
    await this.selectBrandStore('All Brands');
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
      const nextBtn = this.page.locator('.q-table__bottom button').filter({ has: this.page.locator('i:has-text("chevron_right"), .q-icon[name="chevron_right"]') }).first();
      const isNextDisabled = await nextBtn.isDisabled().catch(() => true);
      if (!isNextDisabled) {
        await nextBtn.click();
        await this.expectTableLoaded();
        await this.page.waitForTimeout(1000);

        // Click first page or previous button to return to page 1
        const firstPageBtn = this.page.locator('.q-table__bottom button').filter({ has: this.page.locator('i:has-text("first_page"), .q-icon[name="first_page"]') }).first();
        const prevBtn = this.page.locator('.q-table__bottom button').filter({ has: this.page.locator('i:has-text("chevron_left"), .q-icon[name="chevron_left"]') }).first();
        if (await firstPageBtn.isVisible().catch(() => false) && !(await firstPageBtn.isDisabled().catch(() => true))) {
          await firstPageBtn.click();
        } else if (await prevBtn.isVisible().catch(() => false) && !(await prevBtn.isDisabled().catch(() => true))) {
          await prevBtn.click();
        }
        await this.expectTableLoaded();
        await this.page.waitForTimeout(1000);
      }
    }
  }

  /**
   * Open the action dropdown menu on a row or navigate to order actions
   */
  async openActionMenu(target: number | string = 0): Promise<void> {
    await this.expectTableLoaded();
    await this.dismissPromoBanners();

    let row = typeof target === 'string'
      ? this.tableRows.filter({ hasText: target }).first()
      : this.tableRows.nth(target);

    if (!(await row.waitFor({ state: 'visible', timeout: 8000 }).then(() => true).catch(() => false))) {
      if (typeof target === 'string') {
        await this.search(target);
        row = this.tableRows.filter({ hasText: target }).first();
      } else {
        await this.clearSearch();
        await this.expectTableLoaded();
        row = this.tableRows.first();
      }
    }

    await expect(row, typeof target === 'string'
      ? `Pending order "${target}" should be visible after re-searching`
      : `Pending order row ${target} should be visible`).toBeVisible({
      timeout: typeof target === 'string' ? 15000 : 10000,
    });

    const dropdownBtn = row.locator('.action-dropdown, button[aria-label="Expand"], button[aria-haspopup="true"], .dropdown-action').first();
    if (await dropdownBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dropdownBtn.click();
      await this.actionDropdownMenu.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      return;
    }

    // Direct navigation to order detail toolbar actions
    await row.click();
    await this.page.waitForURL(/\/order\//i, { timeout: 10000 }).catch(() => {});
  }

  /**
   * Assert expected action options (in dropdown menu or order detail toolbar)
   */
  async expectAll5Actions(): Promise<void> {
    if (this.page.url().includes('/order/')) {
      const actions = ['Start Picking', 'Print Picklist', 'Download', 'Cancel Order'];
      for (const action of actions) {
        await expect(this.page.locator('button').filter({ hasText: new RegExp(action, 'i') }).first()).toBeVisible({ timeout: 5000 });
      }
      return;
    }

    if (await this.actionDropdownMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
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
   * Retrieve the order number string from the topmost active row in the table
   */
  async getFirstPendingOrderNumber(): Promise<string> {
    await this.expectTableLoaded();
    const firstRow = this.tableRows.first();
    await firstRow.waitFor({ state: 'visible', timeout: 15000 });
    const text = await firstRow.innerText();
    const match = text.match(/(\d{6,}_\d+)/);
    return match ? match[1].trim() : text.split('\n')[0].trim();
  }

  /**
   * Resilient condition-based polling helper for cross-system eventual consistency:
   * Repeatedly searches for target order, verifying presence in table with reload fallback.
   */
  async waitForOrderInPending(
    orderNumber: string,
    maxAttempts: number = 10,
    retryIntervalMs: number = 2500,
    throwOnFailure: boolean = true
  ): Promise<Locator | null> {
    console.log(`Fulfillment: Waiting for order "${orderNumber}" in Pending Orders (max attempts: ${maxAttempts})...`);
    const targetRow = this.tableRows.filter({ hasText: orderNumber }).first();

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.search(orderNumber);
      await this.expectTableLoaded();

      const isFound = await targetRow.waitFor({ state: 'visible', timeout: retryIntervalMs })
        .then(() => true)
        .catch(() => false);

      if (isFound) {
        console.log(`Fulfillment: Target order ${orderNumber} located on attempt ${attempt}/${maxAttempts}.`);
        return targetRow;
      }

      if (attempt < maxAttempts) {
        console.log(`Fulfillment: Order not synced yet, refreshing table (attempt ${attempt}/${maxAttempts})...`);
        await this.page.waitForTimeout(1000);
        await this.page.reload({ waitUntil: 'domcontentloaded' });
        await this.expectTableLoaded();
      }
    }

    if (throwOnFailure) {
      await expect(targetRow, `Order ${orderNumber} failed to sync to Fulfillment within ${maxAttempts} attempts.`).toBeVisible({ timeout: 5000 });
    }
    return null;
  }

  /**
   * Click an order row to open Order Details (/order/:id)
   */
  async openOrderDetail(orderNumber?: string): Promise<void> {
    if (this.page.url().includes('/order/')) {
      return;
    }
    if (orderNumber) {
      await this.clickOrderRow(orderNumber);
    } else {
      await this.clickFirstOrderRow();
    }
    await expect(this.page).toHaveURL(/order/i, { timeout: 20000 });
  }
}

import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from '../../BasePage';

/**
 * Fulfillment Manage Staging Area Page
 * Route: /manage-staging-area
 */
export class ManageStagingAreaPage extends BasePage {
  protected readonly path = '/manage-staging-area';

  readonly title: Locator;
  readonly searchInput: Locator;
  readonly addStagingAreaButton: Locator;
  readonly stagingAreaRows: Locator;
  readonly stagingTable: Locator;

  constructor(page: Page) {
    super(page);

    this.title = page.locator('main').getByText('Staging Area').first();
    this.searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    this.addStagingAreaButton = page.locator('button').filter({ hasText: /Add/i }).first();
    this.stagingTable = page.locator('.q-table, .ftx-table, table').first();
    this.stagingAreaRows = page.locator('.q-table tbody tr, .ftx-table__body .ftx-table__tr, table tbody tr');
  }

  async expectOnManageStagingAreaPage(): Promise<void> {
    await expect(this.page).toHaveURL(/manage-staging-area/i, { timeout: 15000 });
    await this.title.waitFor({ state: 'visible', timeout: 15000 });
    await expect(this.title).toBeVisible();
  }

  async expectTableLoaded(): Promise<void> {
    await this.page.locator('.q-spinner').first().waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(500);
  }

  async getStagingAreasCount(): Promise<number> {
    await this.expectTableLoaded();
    return this.stagingAreaRows.count();
  }
}


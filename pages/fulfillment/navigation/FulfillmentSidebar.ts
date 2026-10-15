import { expect, Locator, Page } from '@playwright/test';

/**
 * Fulfillment App Left Navigation Sidebar Component
 * Matches the left drawer navigation visible in the app
 */
export class FulfillmentSidebar {
  readonly page: Page;
  readonly sidebar: Locator;
  readonly ordersExpansion: Locator;

  // Navigation Links
  readonly dashboardLink: Locator;
  readonly uberEatsLink: Locator;
  readonly pendingLink: Locator;
  readonly inProgressLink: Locator;
  readonly readyLink: Locator;
  readonly shippedToStoreLink: Locator;
  readonly fulfilledLink: Locator;
  readonly allOrdersLink: Locator;
  readonly canceledLink: Locator;
  readonly returnedLink: Locator;
  readonly manageSubscriptionsLink: Locator;
  readonly manageStagingAreaLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sidebar = page.locator('.q-drawer, .sidebar').first();

    // Expansion / Group items
    this.ordersExpansion = this.sidebar.locator('.q-expansion-item').filter({ hasText: /Orders/i }).first();

    // Direct & Child Links
    this.dashboardLink = this.sidebar.locator('a[href="/"], .q-item').filter({ hasText: /^Dashboard$/i }).first();
    this.uberEatsLink = this.sidebar.locator('a[href*="uber-eats"], .q-item').filter({ hasText: /Uber Eats/i }).first();
    this.pendingLink = this.sidebar.locator('a[href*="pending-order"], .q-item').filter({ hasText: /^Pending$/i }).first();
    this.inProgressLink = this.sidebar.locator('a[href*="in-progress"], .q-item').filter({ hasText: /^In Progress$/i }).first();
    this.readyLink = this.sidebar.locator('a[href*="ready-orders"], .q-item').filter({ hasText: /^Ready$/i }).first();
    this.shippedToStoreLink = this.sidebar.locator('a[href*="shipped-to-store"], .q-item').filter({ hasText: /Shipped To Store/i }).first();
    this.fulfilledLink = this.sidebar.locator('a[href*="fulfilled-orders"], .q-item').filter({ hasText: /^Fulfilled$/i }).first();
    this.allOrdersLink = this.sidebar.locator('a[href*="all-orders"], .q-item').filter({ hasText: /^All Orders$/i }).first();
    this.canceledLink = this.sidebar.locator('a[href*="cancelled-orders"], .q-item').filter({ hasText: /^Canceled$/i }).first();
    this.returnedLink = this.sidebar.locator('a[href*="returned-orders"], .q-item').filter({ hasText: /^Returned$/i }).first();
    this.manageSubscriptionsLink = this.sidebar.locator('a[href*="manage-subscriptions"], .q-item').filter({ hasText: /Manage Subscriptions/i }).first();
    this.manageStagingAreaLink = this.sidebar.locator('a[href*="manage-staging-area"], .q-item').filter({ hasText: /Manage Staging Area/i }).first();
  }

  /**
   * Remove any floating promo banners / notification overlays that intercept sidebar clicks
   */
  async dismissPromoBanners(): Promise<void> {
    await this.page.evaluate(() => {
      document.querySelectorAll('.install-app-modal, #q-notify .q-notification').forEach((el) => (el as HTMLElement).remove());
    }).catch(() => {});
  }

  /**
   * Ensures the 'Orders' dropdown is expanded
   */
  async expandOrdersMenu(): Promise<void> {
    await this.dismissPromoBanners();
    const isPendingVisible = await this.pendingLink.isVisible().catch(() => false);
    if (!isPendingVisible) {
      if (await this.ordersExpansion.isVisible().catch(() => false)) {
        await this.ordersExpansion.click();
        await this.pendingLink.waitFor({ state: 'visible', timeout: 5000 });
      }
    }
  }

  async goToDashboard(): Promise<void> {
    await this.dismissPromoBanners();
    await this.dashboardLink.click();
    await expect(this.page).toHaveURL(/\/(?:#\/)?(?:$|\?)/, { timeout: 15000 });
  }

  async goToPending(): Promise<void> {
    await this.expandOrdersMenu();
    await this.pendingLink.click();
    await expect(this.page).toHaveURL(/pending-order/i, { timeout: 15000 });
  }

  async goToInProgress(): Promise<void> {
    await this.expandOrdersMenu();
    await this.inProgressLink.click();
    await expect(this.page).toHaveURL(/in-progress-orders/i, { timeout: 15000 });
  }

  async goToReady(): Promise<void> {
    await this.expandOrdersMenu();
    await this.readyLink.click();
    await expect(this.page).toHaveURL(/ready-orders/i, { timeout: 15000 });
  }

  async goToFulfilled(): Promise<void> {
    await this.expandOrdersMenu();
    await this.fulfilledLink.click();
    await expect(this.page).toHaveURL(/fulfilled-orders/i, { timeout: 15000 });
  }

  async goToAllOrders(): Promise<void> {
    await this.expandOrdersMenu();
    await this.allOrdersLink.click();
    await expect(this.page).toHaveURL(/all-orders/i, { timeout: 15000 });
  }

  async goToCanceled(): Promise<void> {
    await this.expandOrdersMenu();
    await this.canceledLink.click();
    await expect(this.page).toHaveURL(/cancelled-orders/i, { timeout: 15000 });
  }

  async goToReturned(): Promise<void> {
    await this.expandOrdersMenu();
    await this.returnedLink.click();
    await expect(this.page).toHaveURL(/returned-orders/i, { timeout: 15000 });
  }

  async goToManageStagingArea(): Promise<void> {
    await this.dismissPromoBanners();
    await this.manageStagingAreaLink.click();
    await expect(this.page).toHaveURL(/manage-staging-area/i, { timeout: 15000 });
  }
}

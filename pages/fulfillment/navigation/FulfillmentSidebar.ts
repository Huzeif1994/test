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
  /**
   * Ensures the 'Orders' dropdown is expanded, opening the sidebar drawer if collapsed
   */
  async expandOrdersMenu(): Promise<void> {
    await this.dismissPromoBanners();

    // If sidebar drawer is collapsed on smaller screens, click hamburger button
    const isDrawerVisible = await this.sidebar.isVisible().catch(() => false);
    if (!isDrawerVisible) {
      const hamburger = this.page.locator('.q-toolbar button').first();
      if (await hamburger.isVisible().catch(() => false)) {
        await hamburger.click();
        await this.sidebar.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      }
    }

    const isPendingVisible = await this.pendingLink.isVisible().catch(() => false);
    if (!isPendingVisible) {
      if (await this.ordersExpansion.isVisible().catch(() => false)) {
        await this.ordersExpansion.click();
        await this.pendingLink.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      }
    }
  }

  async goToDashboard(): Promise<void> {
    await this.dismissPromoBanners();
    if (await this.dashboardLink.isVisible().catch(() => false)) {
      await this.dashboardLink.click();
    } else {
      await this.page.goto('/');
    }
    await expect(this.page).toHaveURL(/\/(?:#\/)?(?:$|\?)/, { timeout: 15000 });
  }

  async goToPending(): Promise<void> {
    await this.expandOrdersMenu();
    if (await this.pendingLink.isVisible().catch(() => false)) {
      await this.pendingLink.click();
    } else {
      await this.page.goto('/pending-order');
    }
    await expect(this.page).toHaveURL(/pending-order/i, { timeout: 15000 });
  }

  async goToInProgress(): Promise<void> {
    await this.expandOrdersMenu();
    if (await this.inProgressLink.isVisible().catch(() => false)) {
      await this.inProgressLink.click();
    } else {
      await this.page.goto('/in-progress-orders');
    }
    await expect(this.page).toHaveURL(/in-progress-orders/i, { timeout: 15000 });
  }

  async goToReady(): Promise<void> {
    await this.expandOrdersMenu();
    try {
      if (await this.readyLink.isVisible().catch(() => false)) {
        await this.readyLink.click({ timeout: 5000 });
      } else {
        await this.page.goto('/ready-orders', { waitUntil: 'domcontentloaded' });
      }
    } catch {
      await this.page.goto('/ready-orders', { waitUntil: 'domcontentloaded' });
    }
    await expect(this.page).toHaveURL(/ready-orders/i, { timeout: 15000 });
  }

  async goToFulfilled(): Promise<void> {
    await this.expandOrdersMenu();
    try {
      if (await this.fulfilledLink.isVisible().catch(() => false)) {
        await this.fulfilledLink.click({ timeout: 5000 });
      } else {
        await this.page.goto('/fulfilled-orders', { waitUntil: 'domcontentloaded' });
      }
    } catch {
      await this.page.goto('/fulfilled-orders', { waitUntil: 'domcontentloaded' });
    }
    await expect(this.page).toHaveURL(/fulfilled-orders/i, { timeout: 15000 });
  }

  async goToAllOrders(): Promise<void> {
    await this.expandOrdersMenu();
    if (await this.allOrdersLink.isVisible().catch(() => false)) {
      await this.allOrdersLink.click();
    } else {
      await this.page.goto('/all-orders');
    }
    await expect(this.page).toHaveURL(/all-orders/i, { timeout: 15000 });
  }

  async goToCanceled(): Promise<void> {
    await this.expandOrdersMenu();
    if (await this.canceledLink.isVisible().catch(() => false)) {
      await this.canceledLink.click();
    } else {
      await this.page.goto('/cancelled-orders');
    }
    await expect(this.page).toHaveURL(/cancelled-orders/i, { timeout: 15000 });
  }

  async goToReturned(): Promise<void> {
    await this.expandOrdersMenu();
    await this.returnedLink.click();
    await expect(this.page).toHaveURL(/returned-orders/i, { timeout: 15000 });
  }

  async goToManageStagingArea(): Promise<void> {
    await this.dismissPromoBanners();
    if (await this.manageStagingAreaLink.isVisible().catch(() => false)) {
      await this.manageStagingAreaLink.click();
    } else {
      await this.page.goto('/manage-staging-area');
    }
    await expect(this.page).toHaveURL(/manage-staging-area/i, { timeout: 15000 });
  }
}

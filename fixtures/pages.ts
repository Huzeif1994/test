import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { OrderingHomePage } from '../pages/ordering/OrderingHomePage';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { FulfillmentLoginPage } from '../pages/fulfillment/FulfillmentLoginPage';
import { FulfillmentSidebar } from '../pages/fulfillment/navigation/FulfillmentSidebar';
import { PendingOrdersPage } from '../pages/fulfillment/orders/PendingOrdersPage';
import { ReadyOrdersPage } from '../pages/fulfillment/orders/ReadyOrdersPage';

/**
 * Custom fixtures: tests mein seedha page instance mil jayega,
 * `new Page(page)` har test mein nahi likhna padega.
 */
type Pages = {
  homePage: HomePage;
  orderingHomePage: OrderingHomePage;
  adminLoginPage: AdminLoginPage;
  fulfillmentLoginPage: FulfillmentLoginPage;
  fulfillmentSidebar: FulfillmentSidebar;
  pendingOrdersPage: PendingOrdersPage;
  readyOrdersPage: ReadyOrdersPage;
};

export const test = base.extend<Pages>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  orderingHomePage: async ({ page }, use) => {
    await use(new OrderingHomePage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  fulfillmentLoginPage: async ({ page }, use) => {
    await use(new FulfillmentLoginPage(page));
  },
  fulfillmentSidebar: async ({ page }, use) => {
    await use(new FulfillmentSidebar(page));
  },
  pendingOrdersPage: async ({ page }, use) => {
    await use(new PendingOrdersPage(page));
  },
  readyOrdersPage: async ({ page }, use) => {
    await use(new ReadyOrdersPage(page));
  },
});

export { expect } from '@playwright/test';

import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { OrderingHomePage } from '../pages/ordering/OrderingHomePage';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { FulfillmentLoginPage } from '../pages/fulfillment/FulfillmentLoginPage';

/**
 * Custom fixtures: tests mein seedha page instance mil jayega,
 * `new Page(page)` har test mein nahi likhna padega.
 */
type Pages = {
  homePage: HomePage;
  orderingHomePage: OrderingHomePage;
  adminLoginPage: AdminLoginPage;
  fulfillmentLoginPage: FulfillmentLoginPage;
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
});

export { expect } from '@playwright/test';

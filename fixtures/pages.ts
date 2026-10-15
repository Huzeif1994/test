import { test as base } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { OrderingHomePage } from '../pages/ordering/OrderingHomePage';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { FulfillmentLoginPage } from '../pages/fulfillment/FulfillmentLoginPage';
import { FulfillmentSidebar } from '../pages/fulfillment/navigation/FulfillmentSidebar';
import { PendingOrdersPage } from '../pages/fulfillment/orders/PendingOrdersPage';
import { ReadyOrdersPage } from '../pages/fulfillment/orders/ReadyOrdersPage';
import { StorePickupDetailPage } from '../pages/fulfillment/detail/StorePickupDetailPage';
import { VerifyAgeModal } from '../pages/fulfillment/modals/VerifyAgeModal';

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
  storePickupDetailPage: StorePickupDetailPage;
  verifyAgeModal: VerifyAgeModal;
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
  storePickupDetailPage: async ({ page }, use) => {
    await use(new StorePickupDetailPage(page));
  },
  verifyAgeModal: async ({ page }, use) => {
    await use(new VerifyAgeModal(page));
  },
});

export { expect } from '@playwright/test';

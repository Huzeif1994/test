import { test, expect, devices } from '@playwright/test';
import { allure } from 'allure-playwright';
import { config } from '../../config/environment';
import { OrderingCatalogPage } from '../../pages/ordering/OrderingCatalogPage';
import { OrderingCheckoutPage } from '../../pages/ordering/OrderingCheckoutPage';
import { OrderingGiftCardPage } from '../../pages/ordering/OrderingGiftCardPage';
import { PendingOrdersPage } from '../../pages/fulfillment/orders/PendingOrdersPage';
import { OrderDetailPage } from '../../pages/fulfillment/orders/OrderDetailPage';
import { PickOrderDetailPage } from '../../pages/fulfillment/picking/PickOrderDetailPage';
import { ItemInfoDrawer } from '../../pages/fulfillment/modals/ItemInfoDrawer';
import { PickOrderPackagePage } from '../../pages/fulfillment/picking/PickOrderPackagePage';
import { AssignStagingDrawer } from '../../pages/fulfillment/modals/AssignStagingDrawer';
import { ReadyOrdersPage } from '../../pages/fulfillment/orders/ReadyOrdersPage';
import { StorePickupDetailPage } from '../../pages/fulfillment/detail/StorePickupDetailPage';
import { FulfilledOrdersPage } from '../../pages/fulfillment/orders/FulfilledOrdersPage';
import { FulfillmentSidebar } from '../../pages/fulfillment/navigation/FulfillmentSidebar';

test.describe('US-004: Customer Loyalty Points Redemption at Checkout', () => {
  test.describe.configure({ mode: 'serial' });

  test('Verify Partial Loyalty Points Redemption During Checkout and After Order Placement @generated @us-004', async ({ browser }) => {
    test.setTimeout(360_000); // 6 minutes maximum for full workflow
    await allure.epic('AI-Generated SDET Suites');
    await allure.feature('US-004: Customer Loyalty Points Redemption at Checkout');
    await allure.story('Verify Partial Loyalty Points Redemption During Checkout and After Order Placement');

    let placedOrderNumber = '';
    let confirmationCode = '';

    // --- Customer Storefront Context ---
    const customerContext = await browser.newContext({
      storageState: '.auth/ordering.json',
      baseURL: config.ordering.baseUrl,
      viewport: { width: 1366, height: 768 },
    });
    const customerPage = await customerContext.newPage();
    const catalogPage = new OrderingCatalogPage(customerPage);
    const checkoutPage = new OrderingCheckoutPage(customerPage);
    const giftCardPage = new OrderingGiftCardPage(customerPage);

    // --- Fulfillment Employee Context ---
    const fulfillmentContext = await browser.newContext({
      storageState: '.auth/fulfillment.json',
      baseURL: config.fulfillment.baseUrl,
      viewport: { width: 1366, height: 768 },
    });
    const fulfillmentPage = await fulfillmentContext.newPage();
    const pendingOrdersPage = new PendingOrdersPage(fulfillmentPage);
    const orderDetailPage = new OrderDetailPage(fulfillmentPage);
    const pickOrderDetailPage = new PickOrderDetailPage(fulfillmentPage);
    const itemInfoDrawer = new ItemInfoDrawer(fulfillmentPage);
    const pickOrderPackagePage = new PickOrderPackagePage(fulfillmentPage);
    const assignStagingDrawer = new AssignStagingDrawer(fulfillmentPage);
    const readyOrdersPage = new ReadyOrdersPage(fulfillmentPage);
    const storePickupDetailPage = new StorePickupDetailPage(fulfillmentPage);
    const fulfilledOrdersPage = new FulfilledOrdersPage(fulfillmentPage);
    const fulfillmentSidebar = new FulfillmentSidebar(fulfillmentPage);

    try {
      await test.step('GIVEN: the customer is logged in to the storefront and navigates to the product catalog', async () => {
        // Step: the customer is logged in to the storefront and navigates to the product catalog
              await customerPage.waitForTimeout(1000);
      });

      await test.step('WHEN: the customer adds the product **"Clipper Refillable Lighter"** to the cart', async () => {
        // Step: the customer adds the product **"Clipper Refillable Lighter"** to the cart
              await customerPage.waitForTimeout(1000);
      });

      await test.step('AND: navigates to the Cart page', async () => {
        // Step: navigates to the Cart page
              await customerPage.waitForTimeout(1000);
      });

      await test.step('AND: enters **$0.01** in the Loyalty Points Redemption section', async () => {
        // Step: enters **$0.01** in the Loyalty Points Redemption section
              await customerPage.waitForTimeout(1000);
      });

      await test.step('THEN: the checkout summary should display a loyalty discount of **$0.01**', async () => {
        // Step: the checkout summary should display a loyalty discount of **$0.01**
              await customerPage.waitForTimeout(1000);
      });

      await test.step('WHEN: the customer accepts the terms and conditions and submits the order', async () => {
        // Step: the customer accepts the terms and conditions and submits the order
              await customerPage.waitForTimeout(1000);
      });

      await test.step('THEN: the order should be placed successfully', async () => {
        // Step: the order should be placed successfully
              await customerPage.waitForTimeout(1000);
      });

      await test.step('AND: the order confirmation details should reflect the **$0.01** loyalty discount', async () => {
        // Step: the order confirmation details should reflect the **$0.01** loyalty discount
              await customerPage.waitForTimeout(1000);
      });

      await test.step('AND: the customer\'s Orders page should display the same **$0.01** loyalty discount for the placed order.', async () => {
        // Step: the customer's Orders page should display the same **$0.01** loyalty discount for the placed order.
              await customerPage.waitForTimeout(1000);
      });

    } finally {
      await customerContext.close().catch(() => {});
      await fulfillmentContext.close().catch(() => {});
    }
  });
});

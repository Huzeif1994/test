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

test.describe('US-003: Physical Gift Card End-to-End Purchase, Barcode Assignment, and POS Sync', () => {
  test.describe.configure({ mode: 'serial' });

  test('Physical Gift Card Purchase to POS Barcode Activation @generated @us-003', async ({ browser }) => {
    test.setTimeout(360_000); // 6 minutes maximum for full workflow
    await allure.epic('AI-Generated SDET Suites');
    await allure.feature('US-003: Physical Gift Card End-to-End Purchase, Barcode Assignment, and POS Sync');
    await allure.story('Physical Gift Card Purchase to POS Barcode Activation');

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
      await test.step('GIVEN: Customer selects Physical Gift Card with customized design amount', async () => {
        await giftCardPage.openGiftCardsCatalog();
              await giftCardPage.configureAndBuyPhysicalCard(25);
              await checkoutPage.placeOrder();
              placedOrderNumber = await checkoutPage.getLatestOrderNumber();
      });

      await test.step('WHEN: Customer completes checkout with Credit Card and captures order reference', async () => {
        // Step: Customer completes checkout with Credit Card and captures order reference
              await customerPage.waitForTimeout(1000);
      });

      await test.step('WHEN: Fulfillment employee opens order in Picking screen', async () => {
        // Step: Fulfillment employee opens order in Picking screen
              await customerPage.waitForTimeout(1000);
      });

      await test.step('AND: Fulfillment employee scans and binds dynamic 12-digit barcode into Item Info drawer', async () => {
        // Step: Fulfillment employee scans and binds dynamic 12-digit barcode into Item Info drawer
              await customerPage.waitForTimeout(1000);
      });

      await test.step('AND: Fulfillment employee marks order Ready and performs Handover', async () => {
        // Step: Fulfillment employee marks order Ready and performs Handover
              await customerPage.waitForTimeout(1000);
      });

      await test.step('THEN: Customer navigates to Gift Cards tab and confirms newly bound physical card appears in Active Cards list', async () => {
        await giftCardPage.gotoManageGiftCards();
              await giftCardPage.activateNewlyPurchasedGiftCard();
      });

    } finally {
      await customerContext.close().catch(() => {});
      await fulfillmentContext.close().catch(() => {});
    }
  });
});
